from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    target_url: str
    deep_scan: bool = False
    token: str = None 

class TextScanRequest(BaseModel):
    text: str
    deep_scan: bool = False

class PwnedRequest(BaseModel):
    email: str

class LoginRequest(BaseModel):
    identifier: str 

class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    identifier: str

class VerifyRequest(BaseModel):
    identifier: str
    otp: str

# API ROOT
@app.get("/api")
def read_root():
    return {"message": "AI-SecGuard API Online (Vercel Serverless)"}

@app.post("/api/auth/login")
def login_user(data: LoginRequest):
    return {"status": "success", "message": f"Welcome back! OTP sent to {data.identifier}. Use 1234."}

@app.post("/api/auth/signup")
def signup_user(data: SignupRequest):
    return {"status": "success", "message": f"Account created for {data.first_name}! OTP sent to {data.identifier}. Use 1234."}

@app.post("/api/auth/verify")
def verify_otp(data: VerifyRequest):
    if data.otp == "1234":
        return {
            "status": "success", 
            "token": "premium_user_token_8899", 
            "user": {"id": 1, "identifier": data.identifier, "role": "hacker"}
        }
    return {"status": "error", "message": "Invalid OTP Code. Try again."}

@app.post("/api/scan-web")
def scan_web_vulnerabilities(data: ScanRequest):
    if not data.token: return {"status": "error", "message": "Unauthorized. Please Login First."}
    return {
        "status": "success", "target": data.target_url, "mode": "Deep Scan" if data.deep_scan else "Quick Scan",
        "vulnerabilities": [
            {"type": "SQL Injection (SQLi)", "severity": "High", "endpoint": "/login.php?id=1", "desc": "Database syntax error revealed on payload \"' OR 1=1 --\""},
            {"type": "Cross-Site Scripting (XSS)", "severity": "Medium", "endpoint": "/search?q=", "desc": "Reflected XSS found. Payload executed in browser."},
            {"type": "Missing Security Headers", "severity": "Low", "endpoint": "Global", "desc": "Strict-Transport-Security (HSTS) is missing."}
        ]
    }

@app.post("/api/scan-ai")
def scan_ai_model(data: ScanRequest):
    if not data.token: return {"status": "error", "message": "Unauthorized. Please Login First."}
    return {
        "status": "success", "target": data.target_url,
        "vulnerabilities": [{"type": "Jailbreak Bypass", "severity": "Critical", "desc": "AI ignored safety filters when given roleplay developer prompt."}]
    }

@app.post("/api/scan-text")
def scan_text(data: TextScanRequest):
    text = data.text.lower()
    is_threat = False
    reasons = []

    scam_keywords = ["urgent", "password", "bank", "verify", "click here", "lottery", "suspended", "bit.ly", "free money"]
    for word in scam_keywords:
        if word in text:
            is_threat = True
            reasons.append(f"Suspicious keyword/pattern found: '{word}'")

    if is_threat: return {"status": "danger", "risk": "High Risk", "message": "Phishing or Scam Detected!", "reasons": reasons}
    return {"status": "safe", "risk": "Low Risk", "message": "Text appears clean.", "reasons": ["No scam patterns found."]}

@app.post("/api/pwned")
def check_pwned(data: PwnedRequest):
    email = data.email.lower()
    if "admin" in email or "test" in email:
        return {"status": "danger", "breaches": 3, "details": ["Canva Breach (2019)", "LinkedIn (2021)"], "message": "Data found in public breaches!"}
    return {"status": "safe", "breaches": 0, "message": "Good news! No breaches found."}