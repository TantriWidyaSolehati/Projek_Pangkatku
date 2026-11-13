import os
from typing import Literal
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, model_validator

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_API_URL = os.getenv("AI_API_URL", "https://api.openai.com/v1/chat/completions")
AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
if "*" in CORS_ORIGINS:
    raise ValueError("CORS_ORIGINS harus berisi origin eksplisit; wildcard tidak diizinkan.")

app = FastAPI(title="RuangEksponen API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=5000)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Pesan tidak boleh kosong.")
        return value.strip()

    @model_validator(mode="after")
    def limit_student_message(self) -> "ChatMessage":
        if self.role == "user" and len(self.content) > 1500:
            raise ValueError("Pesan siswa maksimal 1500 karakter.")
        return self


class TutorRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=10)

    @field_validator("messages")
    @classmethod
    def conversation_must_end_with_student(cls, messages: list[ChatMessage]) -> list[ChatMessage]:
        if messages[-1].role != "user":
            raise ValueError("Pesan terakhir harus berasal dari siswa.")
        if sum(len(message.content) for message in messages) > 12000:
            raise ValueError("Total percakapan maksimal 12000 karakter.")
        return messages


async def require_authenticated_user(authorization: str | None = Header(default=None)) -> str:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(status_code=503, detail="Autentikasi Supabase belum dikonfigurasi di backend.")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sesi masuk diperlukan.")

    access_token = authorization.removeprefix("Bearer ").strip()
    if not access_token:
        raise HTTPException(status_code=401, detail="Token sesi tidak valid.")

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {access_token}"},
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail="Tidak dapat memverifikasi sesi melalui Supabase.") from exc

    if response.status_code >= 500:
        raise HTTPException(status_code=503, detail="Supabase tidak dapat memverifikasi sesi saat ini.")
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Sesi tidak valid atau telah kedaluwarsa.")
    try:
        user_payload = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Supabase mengembalikan respons sesi dengan format tidak valid.") from exc
    user_id = user_payload.get("id") if isinstance(user_payload, dict) else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Supabase tidak mengembalikan identitas pengguna.")
    return user_id


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/tutor")
async def tutor_reply(payload: TutorRequest, _user_id: str = Depends(require_authenticated_user)) -> dict[str, str]:
    if not AI_API_KEY:
        raise HTTPException(status_code=503, detail="AI Tutor belum dikonfigurasi. Tambahkan AI_API_KEY pada backend/.env.")
    parsed_url = urlparse(AI_API_URL)
    if parsed_url.scheme != "https" and parsed_url.hostname not in {"localhost", "127.0.0.1"}:
        raise HTTPException(status_code=500, detail="AI_API_URL harus menggunakan HTTPS.")

    system_prompt = (
        "Kamu adalah Kak Eksponen, tutor matematika SMP yang ramah, sabar, dan menggunakan bahasa Indonesia sederhana. "
        "Fokus pada bilangan berpangkat bulat positif dan negatif serta prasyaratnya. "
        "Bimbing siswa dengan pertanyaan dan petunjuk bertahap; jelaskan alasan di balik setiap langkah, "
        "jangan langsung memberikan jawaban akhir jika siswa sedang belajar menyelesaikan soal. "
        "Jelaskan bahwa a^(-n)=1/(a^n) untuk a bukan nol dan pangkat negatif bukan tanda bahwa nilainya negatif. "
        "Tunjukkan langkah hitung secara akurat, gunakan format teks yang mudah dibaca, dan jangan mengarang rumus. "
        "Jika pertanyaan di luar matematika SMP, arahkan dengan sopan kembali ke materi."
    )
    request_body = {
        "model": AI_MODEL,
        "messages": [{"role": "system", "content": system_prompt}]
        + [{"role": message.role, "content": message.content} for message in payload.messages],
        "temperature": 0.4,
        "max_tokens": 700,
    }

    try:
        async with httpx.AsyncClient(timeout=35.0) as client:
            response = await client.post(
                AI_API_URL,
                headers={"Authorization": f"Bearer {AI_API_KEY}", "Content-Type": "application/json"},
                json=request_body,
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="Tutor membutuhkan waktu terlalu lama. Coba lagi sebentar lagi.") from exc
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail="Tidak dapat terhubung ke layanan AI.") from exc

    if response.is_error:
        raise HTTPException(status_code=502, detail=f"Layanan AI menolak permintaan (HTTP {response.status_code}).")
    try:
        answer = response.json()["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="Layanan AI mengembalikan respons dengan format tidak valid.") from exc
    if not isinstance(answer, str) or not answer.strip():
        raise HTTPException(status_code=502, detail="Layanan AI mengembalikan jawaban kosong.")
    return {"answer": answer.strip()}
