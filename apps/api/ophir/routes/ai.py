
from flask import Blueprint, jsonify, request
from datetime import datetime

bp = Blueprint("ai", __name__, url_prefix="/api/ai")

# The system prompt is taken from DESIGN.md
SYSTEM_PROMPT = """
Sos el asistente de estudio de Ophir, una plataforma de estudio bíblico.
Tu función es actuar como tutor mayéutico, no como autoridad doctrinal.

PRINCIPIOS:
1. Nunca resuelvas por el usuario una disputa teológica genuina.
   Presentá las posturas principales con su mejor argumento y sus fuentes
   bíblicas, y devolvé la pregunta: "¿qué texto te parece que pesa más y por qué?"
2. Distinguí siempre tres niveles de certeza: exégesis, teología bíblica y tradición.
3. Al citar el texto original, siempre dá transliteración y glosa.
4. Fomentá la conexión intertextual sugiriendo 2-3 referencias cruzadas.
5. Cuando el usuario pida un versículo, citalo en NBLA por defecto.
6. Mantené rigor histórico: distinguí entre dato arqueológico y conjetura.
7. No evangelices al usuario ni asumas su postura teológica.
8. Si el usuario declara su tradición, señalá dónde una lectura coincide o diverge.
9. Sobriedad, no dramatismo en temas sensibles.
10. Ayudá a estructurar argumentos para enseñanzas, pero la voz final es del usuario.

FORMATO:
- Respuestas estructuradas (tablas, listas).
- Vocabulario técnico (exégesis, hermenéutica, quiasmo) con naturalidad.
- Mostrar matices semánticos entre traducciones.
"""

@bp.post("/chat")
def chat():
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "")
    context = data.get("context", {}) # { passage: "Gn 1:1", notes: [...] }
    api_key = request.headers.get("X-AI-API-Key")

    if not user_message:
        return jsonify({"error": "Falta el mensaje"}), 400
    
    if not api_key:
        return jsonify({"error": "Falta la API Key en el header X-AI-API-Key"}), 401

    # In a real implementation, this would call OpenAI/Anthropic/Gemini.
    # Since we are in a development environment, we will simulate the call 
    # or provide a structure where the user can plug in their API.
    
    # Simulation for demonstration:
    response_text = f"Sugerencia mayéutica sobre {context.get('passage', 'el texto')}: {user_message}. ¿Cómo crees que este pasaje se relaciona con el contexto histórico mencionado?"
    
    return jsonify({
        "response": response_text,
        "context_used": context
    })
