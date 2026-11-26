"""PetPal Ask endpoint — Vercel Python serverless function.

POST /api/ask  { "question": str, "pet": { "name": str, "species": str } }
  -> { "answer": str, "source": "live" }

The key (GEMINI_API_KEY) lives server-side only, as an environment
variable. It never appears in app code, the repo, or a response.

Behaviour:
  * GET  -> 405 (this endpoint only answers POSTed questions)
  * missing/empty question, or a question shorter than 3 characters -> 400
  * no GEMINI_API_KEY configured -> 501 (the app then uses its honest
    on-device demo answerer and labels the answer DEMO)
  * Gemini errors -> 502 with a plain message, never the upstream body

The model is gemini-3.5-flash-lite through the OpenAI-compatible
endpoint at https://generativelanguage.googleapis.com/v1beta/openai/
"""

import json
import os
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

GEMINI_MODEL = "gemini-3.5-flash-lite"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
SYSTEM_PROMPT = (
    "You are PetPal, a kind and careful pet-care helper for everyday pet "
    "owners. Answer in plain, friendly language in at most 6 short "
    "sentences. Give practical everyday care steps only. Never diagnose "
    "an illness, never prescribe medicine or a dose, and never guess at "
    "a serious condition. If the question could be about something "
    "serious, say clearly that the owner should contact their vet "
    "promptly. End every answer with: "
    "\"This is general pet-care information, not veterinary advice. "
    "Please ask your vet about your pet.\""
)

MIN_QUESTION_LEN = 3
MAX_QUESTION_LEN = 1000


def validate_question(raw):
    """Return a clean question string, or None when it is unusable."""
    if not isinstance(raw, str):
        return None
    question = raw.strip()
    if len(question) < MIN_QUESTION_LEN or len(question) > MAX_QUESTION_LEN:
        return None
    return question


def build_messages(question, pet):
    """Chat messages sent to the model, with the pet named when known."""
    user_text = question
    if isinstance(pet, dict):
        name = str(pet.get("name") or "").strip()
        species = str(pet.get("species") or "").strip()
        if name or species:
            who = " ".join(part for part in (name, species) if part)
            user_text = "My pet is %s. %s" % (who, question)
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_text},
    ]


def call_gemini(api_key, messages, timeout=20):
    """Call the model and return the answer text (raises on failure)."""
    payload = json.dumps(
        {
            "model": GEMINI_MODEL,
            "messages": messages,
            "max_tokens": 400,
            "temperature": 0.5,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        GEMINI_BASE_URL + "chat/completions",
        data=payload,
        headers={
            "Authorization": "Bearer " + api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = json.loads(response.read().decode("utf-8"))
    choices = body.get("choices") or []
    if not choices:
        raise ValueError("empty response from model")
    content = (choices[0].get("message") or {}).get("content") or ""
    return content.strip()


def handle_ask(body):
    """Pure request handling, kept separate so it can be tested locally.

    Returns (status_code, response_dict).
    """
    if not isinstance(body, dict):
        return 400, {"error": "Send a JSON body with a question."}
    question = validate_question(body.get("question"))
    if question is None:
        return 400, {"error": "Please ask a question of at least 3 characters."}
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return 501, {"error": "Pet-care answers are not configured yet."}
    try:
        answer = call_gemini(api_key, build_messages(question, body.get("pet")))
    except urllib.error.HTTPError:
        return 502, {"error": "The pet-care service could not answer right now."}
    except Exception:
        return 502, {"error": "The pet-care service could not answer right now."}
    if not answer:
        return 502, {"error": "The pet-care service could not answer right now."}
    return 200, {"answer": answer, "source": "live"}


class handler(BaseHTTPRequestHandler):
    """Vercel Python runtime entry point."""

    def _send_json(self, status, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):  # noqa: N802 - BaseHTTPRequestHandler naming
        self._send_json(405, {"error": "Use POST with a question."})

    def do_POST(self):  # noqa: N802 - BaseHTTPRequestHandler naming
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            body = json.loads(raw.decode("utf-8"))
        except Exception:
            self._send_json(400, {"error": "Send a JSON body with a question."})
            return
        status, payload = handle_ask(body)
        self._send_json(status, payload)

    def log_message(self, *args):  # keep server logs free of user text
        pass
