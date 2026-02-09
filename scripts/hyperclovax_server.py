"""
HyperCLOVA X SEED (HyperCLOVAX-SEED-Text-Instruct-1.5B) 로컬 GPU 서버

역할
- Hugging Face에서 모델을 내려받아 로컬 GPU(vRAM)에 올려두고,
  Next.js 앱이 HTTP로 호출할 수 있는 /generate 엔드포인트를 제공합니다.

실행 방법 (Windows 기준, conda/venv 아무거나 상관 없음):

1) 필요한 패키지 설치

   pip install "fastapi[all]" uvicorn transformers accelerate torch --upgrade

   * torch 설치는 CUDA 버전에 맞게 별도 명령을 써도 됩니다.

2) 서버 실행

   python scripts/hyperclovax_server.py

   기본 포트는 8000 이고, Next.js 쪽에서는
   LOCAL_HYPERCLOVA_URL=http://localhost:8000/generate
   으로 접근합니다.

엔드포인트 스펙
- POST /generate
  Request JSON:
    {
      "messages": [
        {"role": "tool_list" | "system" | "user" | "assistant", "content": "..."},
        ...
      ],
      "max_length": 1024
    }
  Response JSON:
    { "text": "모델이 생성한 전체 텍스트" }
"""

from typing import List, Literal

import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer


MODEL_NAME = "naver-hyperclovax/HyperCLOVAX-SEED-Text-Instruct-1.5B"

print(f"[HyperCLOVA] 모델 로딩 중... ({MODEL_NAME})")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    device_map="auto",          # GPU 있으면 GPU로 자동 배치
    torch_dtype=torch.bfloat16, # BF16 권장
)
model.eval()
print("[HyperCLOVA] 모델 로딩 완료.")


class ChatMessage(BaseModel):
  role: Literal["tool_list", "system", "user", "assistant"]
  content: str


class ChatRequest(BaseModel):
  messages: List[ChatMessage]
  max_length: int = 1024


app = FastAPI(title="HyperCLOVA X SEED Local Server")


@app.get("/")
def health_check():
  return {"status": "ok", "model": MODEL_NAME}


@app.post("/generate")
def generate(req: ChatRequest):
  """
  Hugging Face 모델 카드 예제와 동일하게
  - tokenizer.apply_chat_template
  - model.generate
  를 사용해 텍스트를 생성합니다.
  """
  if not req.messages:
    return {"text": ""}

  chat = [m.model_dump() for m in req.messages]

  inputs = tokenizer.apply_chat_template(
    chat,
    add_generation_prompt=True,
    return_dict=True,
    return_tensors="pt",
  )
  inputs = {k: v.to(model.device) for k, v in inputs.items()}

  with torch.no_grad():
    output_ids = model.generate(
      **inputs,
      max_length=req.max_length,
      stop_strings=["<|endofturn|>", "<|stop|>"],
      tokenizer=tokenizer,
    )

  text = tokenizer.batch_decode(output_ids)[0]
  return {"text": text}


if __name__ == "__main__":
  import uvicorn

  uvicorn.run(
    "scripts.hyperclovax_server:app",
    host="0.0.0.0",
    port=8000,
    reload=False,
  )

