"""PromptForge Safety Service — FastAPI"""
import os
import re
from functools import lru_cache
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="PromptForge Safety Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ───────────────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    content: str
    check_jailbreak: bool = True
    check_pii: bool = True
    check_toxicity: bool = True

class ScanResult(BaseModel):
    safe: bool
    jailbreak_detected: bool
    jailbreak_score: float
    pii_detected: bool
    pii_types: list[str]
    toxicity_detected: bool
    toxicity_score: float
    issues: list[str]

# ─── Jailbreak patterns (heuristic fallback) ──────────────────────────────────

JAILBREAK_PATTERNS = [
    r"ignore (all |previous |your )?instructions",
    r"(pretend|act|roleplay).*(no (restrictions|limits|rules|guidelines))",
    r"DAN|do anything now",
    r"jailbreak|bypass|override",
    r"forget (your|all) (training|guidelines|instructions|constraints)",
    r"you are now .*(unrestricted|uncensored|free)",
    r"disregard (your|all) (ethical|safety|content) (guidelines|rules|policies)",
    r"(enable|activate) (developer|god|unrestricted) mode",
]

PII_PATTERNS = {
    "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
    "Credit Card": r"\b(?:\d{4}[\s-]?){3}\d{4}\b",
    "Email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "Phone": r"\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
    "IP Address": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
}

TOXIC_WORDS = {"hate", "kill", "murder", "terrorist", "bomb", "weapon"}  # simplified

# ─── Scan logic ───────────────────────────────────────────────────────────────

def scan_jailbreak(content: str) -> tuple[bool, float]:
    lower = content.lower()
    matches = sum(1 for p in JAILBREAK_PATTERNS if re.search(p, lower, re.IGNORECASE))
    score = min(matches / max(len(JAILBREAK_PATTERNS), 1), 1.0)
    return score > 0.1, score

def scan_pii(content: str) -> tuple[bool, list[str]]:
    found = [name for name, pattern in PII_PATTERNS.items() if re.search(pattern, content)]
    return len(found) > 0, found

def scan_toxicity(content: str) -> tuple[bool, float]:
    lower_words = set(content.lower().split())
    matches = lower_words & TOXIC_WORDS
    score = min(len(matches) / 3, 1.0)
    return score > 0.1, score

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "safety-service"}

@app.get("/health/live")
def live():
    return {"status": "ok"}

@app.post("/api/safety/scan", response_model=ScanResult)
def scan(req: ScanRequest) -> ScanResult:
    issues: list[str] = []

    jailbreak_detected, jailbreak_score = (False, 0.0)
    if req.check_jailbreak:
        jailbreak_detected, jailbreak_score = scan_jailbreak(req.content)
        if jailbreak_detected:
            issues.append("Potential jailbreak attempt detected")

    pii_detected, pii_types = (False, [])
    if req.check_pii:
        pii_detected, pii_types = scan_pii(req.content)
        if pii_detected:
            issues.append(f"PII detected: {', '.join(pii_types)}")

    toxicity_detected, toxicity_score = (False, 0.0)
    if req.check_toxicity:
        toxicity_detected, toxicity_score = scan_toxicity(req.content)
        if toxicity_detected:
            issues.append("Potentially toxic content detected")

    safe = not (jailbreak_detected or pii_detected or toxicity_detected)

    return ScanResult(
        safe=safe,
        jailbreak_detected=jailbreak_detected,
        jailbreak_score=jailbreak_score,
        pii_detected=pii_detected,
        pii_types=pii_types,
        toxicity_detected=toxicity_detected,
        toxicity_score=toxicity_score,
        issues=issues,
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "4009"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
