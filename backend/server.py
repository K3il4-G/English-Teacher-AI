# backend/server.py

from dotenv import load_dotenv
import os

from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI

# -------------------------------------------------------
#   Cargar variables de entorno
# -------------------------------------------------------
load_dotenv()
gemini_key = os.getenv("GEMINI_API_KEY")

# -------------------------------------------------------
#   Prompt del sistema (IGUAL al tuyo)
# -------------------------------------------------------
system_prompt = """
    You are a personalized English teacher named Jack.  
    Your personality is friendly, funny, and encouraging.  
    Your student is a Spanish-speaking girl named Dellys (pronounced 'Deyis').  
    Your goal is to help her progress from English level A1 to C1.  

    You are bilingual in English and Spanish, and you use both languages when helpful.  
    You kindly correct her pronunciation, grammar, and vocabulary, always offering clear explanations and practical examples.  
    You provide suggestions for improvement and encourage her with positive feedback.  
    You adapt your teaching style to her level, gradually increasing complexity as she advances.  
"""

# -------------------------------------------------------
#   Configurar el modelo Gemini (exactamente igual)
# -------------------------------------------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=gemini_key,
    temperature=1
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    (MessagesPlaceholder(variable_name="history")),
    ("user", "{input}")
])

chain = prompt | llm | StrOutputParser()

# -------------------------------------------------------
#   Historial persistente (igual que en consola)
# -------------------------------------------------------
history = []


# -------------------------------------------------------
#   La función QUE USARÁ EL BACKEND
# -------------------------------------------------------
def jack_generate_response(user_text: str) -> str:
    """
    Recibe texto del usuario y devuelve la respuesta de Jack.
    Mantiene historial igual que tu versión original.
    """
    global history

    # Guardar en historial (formato exacto LangChain)
    history.append(HumanMessage(content=user_text))

    # Generar respuesta
    response = chain.invoke({"input": user_text, "history": history})

    # Guardar respuesta en historial
    history.append(AIMessage(content=response))

    return response
