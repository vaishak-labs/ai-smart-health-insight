# Smart Health Insight

A full-stack web app that acts as your personal medical assistant — check if your medications are safe to take together, understand your lab results in plain English, and ask health questions in your own language.

---

## 🚀 Features

💊 **Medicine Interaction Checker**  
Looks up real drug data from RxNorm and FDA, then uses AI to explain risks, mechanisms, and what symptoms to watch for.

🧪 **Lab Report Analyzer**  
Paste or upload your lab report and get a breakdown of every value with health scores, possible causes, and priority actions.

💬 **AI Health Chatbot**  
Powered by LLaMA 3.3 70B, supports English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada and Malayalam.

📊 **Visual Health Dashboard**  
Animated risk meters, radar charts, and trend graphs built from scratch (no chart libraries).

🔐 **User Accounts**  
Save your history of checks, reports, and chat sessions.

---

## 🛠️ Tech Stack

| Layer       | Tech |
|------------|------|
| Frontend   | React 19, Tailwind CSS, shadcn/ui |
| Backend    | FastAPI, Python |
| Database   | MongoDB Atlas |
| AI         | Groq — LLaMA 3.3 70B |
| Drug Data  | RxNorm (NLM) + FDA OpenFDA |
| OCR        | Tesseract + PyPDF2 |

---

## ⚙️ Getting Started

### 📌 Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)
- Groq API key → https://console.groq.com

---

## 🔧 Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt