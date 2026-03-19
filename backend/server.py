# server.py
from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import json
from groq import Groq
import PyPDF2
from PIL import Image
import pytesseract
import io

# Import authentication and models
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user_optional,
    get_current_user,
    generate_reset_token
)
from models import (
    UserSignUp,
    UserSignIn,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    PasswordResetResponse,
    MedicineCheckRequest,
    LabReportRequest,
    ChatMessage,
    TranslateRequest
)

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
import ssl as _ssl
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
_ssl_ctx = _ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = _ssl.CERT_NONE
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ.get('DB_NAME', 'med-checker')
db = client[db_name]

# Groq client (API key from backend .env)
groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY', ''))

# FastAPI app and router
app = FastAPI()
api_router = APIRouter(prefix="/api")

# CORS configuration
# allow origins from frontend; default to localhost dev addresses if not provided
_allowed_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------
# AUTHENTICATION ROUTES
# --------------------------
@api_router.post("/auth/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserSignUp):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)

    user_doc = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.users.insert_one(user_doc)

    access_token = create_access_token(data={"sub": user_id, "email": user_data.email})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            name=user_data.name,
            email=user_data.email,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/signin", response_model=TokenResponse)
async def signin(credentials: UserSignIn):
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            created_at=user["created_at"]
        )
    )

@api_router.post("/auth/forgot-password", response_model=PasswordResetResponse)
async def forgot_password(request: ForgotPasswordRequest):
    user = await db.users.find_one({"email": request.email})
    if not user:
        return PasswordResetResponse(message="If your email is registered, you will receive a password reset link")

    reset_token = generate_reset_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    await db.password_resets.insert_one({
        "user_id": user["id"],
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    logging.info(f"Password reset token for {request.email}: {reset_token}")

    return PasswordResetResponse(
        message="Password reset token generated. Check application logs for the token.",
        reset_token=reset_token
    )

@api_router.post("/auth/reset-password", response_model=PasswordResetResponse)
async def reset_password(request: ResetPasswordRequest):
    reset_doc = await db.password_resets.find_one({"token": request.token, "used": False})
    if not reset_doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    expires_at = datetime.fromisoformat(reset_doc["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired")

    hashed_password = get_password_hash(request.new_password)
    await db.users.update_one({"id": reset_doc["user_id"]}, {"$set": {"password": hashed_password}})
    await db.password_resets.update_one({"token": request.token}, {"$set": {"used": True}})

    return PasswordResetResponse(message="Password reset successful. You can now sign in with your new password.")

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse(id=user["id"], name=user["name"], email=user["email"], created_at=user["created_at"])

# --------------------------
# ROOT
# --------------------------
@api_router.get("/")
async def root():
    return {"message": "Medical Assistant API with Authentication"}

# --------------------------
# MEDICINE INTERACTIONS
# --------------------------
@api_router.post("/medicine/check")
async def check_medicine_interactions(
    request: MedicineCheckRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    try:
        medicines_data = {}
        interactions_found = []

        async with httpx.AsyncClient(timeout=30.0) as http_client:
            for medicine in request.medicines:
                try:
                    medicine_info = {'found': False, 'rxcui': None, 'full_name': medicine}
                    url = f"https://rxnav.nlm.nih.gov/REST/rxcui.json?name={medicine}"
                    response = await http_client.get(url)

                    if response.status_code == 200:
                        data = response.json()
                        if 'idGroup' in data and 'rxnormId' in data['idGroup']:
                            rxcui_list = data['idGroup']['rxnormId']
                            if rxcui_list:
                                rxcui = rxcui_list[0]
                                medicine_info['rxcui'] = rxcui
                                medicine_info['found'] = True

                                props_url = f"https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}/properties.json"
                                props_response = await http_client.get(props_url)
                                if props_response.status_code == 200:
                                    props_data = props_response.json()
                                    if 'properties' in props_data:
                                        props = props_data['properties']
                                        medicine_info['full_name'] = props.get('name', medicine)
                                        medicine_info['rxtty'] = props.get('rxtty', '')

                    try:
                        fda_url = f"https://api.fda.gov/drug/label.json?search=openfda.generic_name:{medicine}&limit=1"
                        fda_response = await http_client.get(fda_url)
                        if fda_response.status_code == 200:
                            fda_data = fda_response.json()
                            if 'results' in fda_data and len(fda_data['results']) > 0:
                                result = fda_data['results'][0]
                                drug_interactions = result.get('drug_interactions', [])
                                if drug_interactions:
                                    medicine_info['fda_interactions'] = drug_interactions[0][:500] if drug_interactions[0] else 'No specific interactions listed'
                                warnings = result.get('warnings', [])
                                if warnings:
                                    medicine_info['warnings'] = warnings[0][:300] if warnings[0] else 'No warnings listed'
                                precautions = result.get('precautions', [])
                                if precautions:
                                    medicine_info['precautions'] = precautions[0][:300] if precautions[0] else 'No precautions listed'
                    except Exception:
                        # don't fail whole flow if fda lookup fails
                        pass

                    medicines_data[medicine] = medicine_info
                except Exception as e:
                    medicines_data[medicine] = {'found': False, 'error': f'Could not fetch data: {str(e)}'}

            # Known interactions database (simplified)
            medicine_names_lower = [m.lower() for m in request.medicines]
            known_interactions = [
                {'drugs': ['warfarin', 'aspirin'], 'description': 'Increased risk of bleeding. Warfarin and aspirin both affect blood clotting.', 'severity': 'high'},
                {'drugs': ['simvastatin', 'clarithromycin'], 'description': 'Clarithromycin can increase simvastatin levels, raising risk of muscle damage (rhabdomyolysis).', 'severity': 'high'},
                {'drugs': ['methotrexate', 'ibuprofen'], 'description': 'NSAIDs like ibuprofen can increase methotrexate toxicity.', 'severity': 'high'},
                {'drugs': ['lisinopril', 'spironolactone'], 'description': 'Increased risk of high potassium levels (hyperkalemia).', 'severity': 'moderate'},
                {'drugs': ['levothyroxine', 'calcium'], 'description': 'Calcium can interfere with levothyroxine absorption. Take 4 hours apart.', 'severity': 'moderate'},
                {'drugs': ['ssri', 'tramadol'], 'description': 'Increased risk of serotonin syndrome when combining SSRIs with tramadol.', 'severity': 'high'},
                {'drugs': ['digoxin', 'furosemide'], 'description': 'Furosemide can lower potassium, increasing digoxin toxicity risk.', 'severity': 'moderate'},
                {'drugs': ['metformin', 'alcohol'], 'description': 'Increased risk of lactic acidosis with heavy alcohol use.', 'severity': 'moderate'}
            ]

            for i, med1 in enumerate(medicine_names_lower):
                for med2 in medicine_names_lower[i+1:]:
                    for interaction in known_interactions:
                        drugs = [d.lower() for d in interaction['drugs']]
                        if (med1 in drugs[0] or drugs[0] in med1) and (med2 in drugs[1] or drugs[1] in med2):
                            interactions_found.append({
                                'drug1': request.medicines[medicine_names_lower.index(med1)],
                                'drug2': request.medicines[medicine_names_lower.index(med2)],
                                'description': interaction['description'],
                                'severity': interaction['severity']
                            })
                        elif (med2 in drugs[0] or drugs[0] in med2) and (med1 in drugs[1] or drugs[1] in med1):
                            interactions_found.append({
                                'drug1': request.medicines[medicine_names_lower.index(med2)],
                                'drug2': request.medicines[medicine_names_lower.index(med1)],
                                'description': interaction['description'],
                                'severity': interaction['severity']
                            })

        found_count = sum(1 for data in medicines_data.values() if data.get('found', False))

        warnings = []
        if interactions_found:
            warnings.append(f"⚠️ {len(interactions_found)} potential drug interaction(s) detected. Consult your healthcare provider immediately.")
        else:
            warnings.append("No known interactions found between these medications in our database.")
        if len(request.medicines) > 1:
            warnings.append("Always inform your doctor and pharmacist about all medications you're taking.")

        ai_analysis = None
        overall_safety = "safe"

        if len(request.medicines) > 1:
            try:
                medicine_list = ", ".join(request.medicines)
                interaction_details = ""
                if interactions_found:
                    for interaction in interactions_found:
                        interaction_details += f"\n- {interaction['drug1']} + {interaction['drug2']}: {interaction['description']} (Severity: {interaction['severity']})"
                    high_severity_count = sum(1 for i in interactions_found if i['severity'] == 'high')
                    overall_safety = "high_risk" if high_severity_count > 0 else "moderate_risk"
                else:
                    interaction_details = "\nNo known interactions detected in our database."

                system_message = """You are a clinical pharmacist AI assistant. Analyze the medicine combination and provide:
1. A brief overall assessment (2-3 sentences)
2. Specific recommendations for the patient
3. Important precautions to take
4. When to seek immediate medical attention

Keep the language simple, clear, and patient-friendly. Always emphasize consulting with healthcare providers."""
                user_message = f"""Medicines being taken together: {medicine_list}

Known interactions from database:{interaction_details}

Provide a comprehensive analysis and recommendations for the patient."""

                response = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.3,
                    max_tokens=1000
                )

                ai_analysis = response.choices[0].message.content
            except Exception as e:
                logging.error(f"Groq AI analysis error: {str(e)}")
                ai_analysis = "AI analysis temporarily unavailable. Please consult your healthcare provider for detailed advice."

        result = {
            'medicines': request.medicines,
            'found_medicines': found_count,
            'total_interactions': len(interactions_found),
            'interactions': interactions_found,
            'individual_data': medicines_data,
            'warnings': warnings,
            'ai_analysis': ai_analysis,
            'overall_safety': overall_safety,
            'data_sources': 'RxNorm (NLM) + FDA OpenFDA + Clinical Database + Groq AI',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

        doc = {
            'id': str(uuid.uuid4()),
            'user_id': current_user['user_id'] if current_user else None,
            'medicines': request.medicines,
            'interactions': result,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        await db.medicine_checks.insert_one(doc)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------
# LAB REPORT ANALYZER (UPDATED — ENGAGING / PATIENT-FRIENDLY OUTPUT)
# --------------------------
@api_router.post("/lab-report/analyze")
async def analyze_lab_report(
    request: LabReportRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    try:
        # New system message: produce friendly, emoji-rich, patient-facing output
        system_message = """You are a professional, patient-friendly medical lab report analyzer. 
Your output must be clean, neatly structured plain text because the UI layout is fixed. 
Do not use any markdown symbols, no bold markers, no stars, no hashtags, no bullets, and no long separators.

Follow this exact structure:

Start with a greeting .

Then present each section using a simple section title on its own line. 
Example:
Blood Sugar
Lipid Profile
Complete Blood Count
Kidney Function
Liver Function
Thyroid
Urine Analysis

Under each section, write short, clean paragraphs explaining the results. 
Show abnormal results like this:
Fasting Blood Glucose: 145 mg/dL (High)

Do not use bullets. Do not use special symbols. Write in smooth paragraphs.

For every abnormal value, explain:
what it means,
why it matters,
what the patient should do next.

Always include practical solutions such as:
foods to eat more of,
foods to reduce,
exercise guidance,
hydration tips,
lifestyle improvements,
stress and sleep guidance,
when to contact a doctor.

Use minimal emojis only where natural.

End with a short encouraging line for the patient.

At the end, add this disclaimer:
This report is for informational purposes only and should not replace professional medical advice.
"""

        user_message = f"Analyze and rewrite this lab report into the friendly format described above:\n\n{request.text}"

        # Call Groq to get the friendly analysis
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.5,
            max_tokens=2000
        )

        analysis = response.choices[0].message.content

        # Save analysis into DB
        doc = {
            'id': str(uuid.uuid4()),
            'user_id': current_user['user_id'] if current_user else None,
            'report_text': request.text,
            'analysis': analysis,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        await db.lab_reports.insert_one(doc)

        return {
            'analysis': analysis,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------
# LAB REPORT UPLOAD (OCR / PDF)
# --------------------------
@api_router.post("/lab-report/upload")
async def upload_lab_report(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = ""

        if file.filename.lower().endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                text += page.extract_text() or ""
        elif file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image = Image.open(io.BytesIO(content))
            text = pytesseract.image_to_string(image)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        return {'extracted_text': text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------
# CHATBOT (SSE streaming)
# --------------------------
@api_router.post("/chat/message")
async def chat_message(
    request: ChatMessage,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    try:
        session_id = request.session_id or str(uuid.uuid4())
        user_id = current_user['user_id'] if current_user else None

        history_doc = await db.conversations.find_one({'session_id': session_id})
        messages = []
        if history_doc and isinstance(history_doc.get('messages'), list):
            messages = history_doc['messages']

        language_map = {
            'en': 'English', 'hi': 'Hindi', 'ta': 'Tamil', 'te': 'Telugu',
            'bn': 'Bengali', 'mr': 'Marathi', 'gu': 'Gujarati',
            'kn': 'Kannada', 'ml': 'Malayalam'
        }
        target_lang = language_map.get(request.language, 'English')

        system_message = f"""You are a helpful medical assistant. Provide accurate medical information and always remind users to consult healthcare professionals.
Respond in: {target_lang}."""

        groq_messages = [{'role': 'system', 'content': system_message}]
        for msg in messages[-10:]:
            groq_messages.append({'role': msg['role'], 'content': msg['content']})
        groq_messages.append({'role': 'user', 'content': request.message})

        async def generate():
            stream = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=groq_messages,
                temperature=0.7,
                max_tokens=2000,
                stream=True
            )

            full_response = ""
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield f"data: {json.dumps({'content': content})}\n\n"

            messages.append({'role': 'user', 'content': request.message})
            messages.append({'role': 'assistant', 'content': full_response})

            await db.conversations.update_one(
                {'session_id': session_id},
                {'$set': {
                    'session_id': session_id,
                    'user_id': user_id,
                    'messages': messages,
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                    'created_at': history_doc['created_at'] if history_doc and 'created_at' in history_doc else datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )

            yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------
# CHAT HISTORY & SESSIONS
# --------------------------
@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    try:
        history = await db.conversations.find_one({'session_id': session_id}, {'_id': 0})
        if not history:
            return {'session_id': session_id, 'messages': []}
        messages = history.get('messages')
        if not isinstance(messages, list):
            messages = []
        return {'session_id': session_id, 'messages': messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/sessions")
async def get_all_sessions(current_user: Optional[dict] = Depends(get_current_user_optional)):
    try:
        query = {}
        if current_user:
            query['user_id'] = current_user['user_id']

        sessions = await db.conversations.find(query, {'_id': 0}).to_list(50)

        for session in sessions:
            messages = session.get('messages') or []
            if not isinstance(messages, list):
                messages = []
            if messages:
                last_msg = messages[-1]
                session['preview'] = last_msg.get('content', '')[:100]
                session['message_count'] = len(messages)
            else:
                session['preview'] = 'No messages yet'
                session['message_count'] = 0

        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------
# TRANSLATE
# --------------------------
@api_router.post("/translate")
async def translate_text(request: TranslateRequest):
    try:
        language_map = {
            'en': 'English', 'hi': 'Hindi', 'ta': 'Tamil', 'te': 'Telugu',
            'bn': 'Bengali', 'mr': 'Marathi', 'gu': 'Gujarati',
            'kn': 'Kannada', 'ml': 'Malayalam'
        }
        target_lang = language_map.get(request.target_language, 'English')

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": f"You are a translator. Translate the following text to {target_lang}. Only provide the translation, nothing else."},
                {"role": "user", "content": request.text}
            ],
            temperature=0.3,
            max_tokens=1000
        )

        return {'translated_text': response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------
# USER HISTORY (requires auth)
# --------------------------
@api_router.get("/user/medicine-checks")
async def get_user_medicine_checks(current_user: dict = Depends(get_current_user)):
    try:
        checks = await db.medicine_checks.find({'user_id': current_user['user_id']}, {'_id': 0}).sort('timestamp', -1).to_list(50)
        return checks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/user/lab-reports")
async def get_user_lab_reports(current_user: dict = Depends(get_current_user)):
    try:
        reports = await db.lab_reports.find({'user_id': current_user['user_id']}, {'_id': 0}).sort('timestamp', -1).to_list(50)
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/user/conversations")
async def get_user_conversations(current_user: dict = Depends(get_current_user)):
    try:
        conversations = await db.conversations.find({'user_id': current_user['user_id']}, {'_id': 0}).sort('updated_at', -1).to_list(50)
        return conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include router and graceful shutdown
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
