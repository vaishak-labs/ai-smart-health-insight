from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid

# Authentication Models
class UserSignUp(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class PasswordResetResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None  # Only for development/testing

# Existing Models (from original server.py)
class MedicineCheckRequest(BaseModel):
    medicines: List[str]

class MedicineInteraction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    medicines: List[str]
    interactions: dict
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LabReportRequest(BaseModel):
    text: str
    report_type: Optional[str] = "general"

class LabReportAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    report_text: str
    analysis: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    message: str
    language: Optional[str] = "en"
    session_id: Optional[str] = None

class ChatHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    session_id: str
    messages: List[dict]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TranslateRequest(BaseModel):
    text: str
    target_language: str
