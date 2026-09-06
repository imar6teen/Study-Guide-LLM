from langgraph.checkpoint.postgres import PostgresSaver
from fastapi import FastAPI, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from typing import Annotated
from starlette.middleware.sessions import SessionMiddleware
from typing import Annotated
from langchain.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
import uuid

from study_guide_llm.configs import SECRET_KEY, MAX_AGE, FRONTEND_URI, DB_URI
from study_guide_llm.app.db import get_session, get_current_user, create_chat_room, create_chat, get_order
from study_guide_llm.routers.auth import router as auth_router
from study_guide_llm.models import Users
from study_guide_llm.agents import agent_builder, GraphState
from study_guide_llm.app.types.chat import Chat


# config : RunnableConfig = {
#     "configurable" : {
#         "thread_id" : "sfjlafstes"
#     }
# }

# with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
#     checkpointer.setup()
#     agent = agent_builder.compile(checkpointer=checkpointer)

#     result = agent.invoke({
#         "messages" : [HumanMessage(content="Can you please create a study guide about trading?")]
#     }, config=config)

# print(result)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware, 
    secret_key=SECRET_KEY, 
    max_age=int(MAX_AGE),
    session_cookie="user_auth",
    same_site="lax", # default
    https_only=False, # TODO: change to True when deploying,
)

app.include_router(auth_router)

session = get_session()

sessionDep = Annotated[Session, Depends(get_session)]

@app.post("/")
def chat(session : sessionDep, data : Chat, response : Response, user : Annotated[Users | None, Depends(get_current_user)]):
    if user is None:
        response.status_code = 401
        return None

    message = data.message
    if type(message) is not str:
        response.status_code = 400
        return None

    thread = data.thread
    if thread is None:
        thread = str(uuid.uuid4())

    config : RunnableConfig = {
        "configurable" : {
            "thread_id" : thread
        }
    }

    with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
        checkpointer.setup()
        agent = agent_builder.compile(checkpointer=checkpointer)

        result : GraphState = agent.invoke({
            "messages" : [HumanMessage(content=message)]
        }, config=config)

    if data.thread is None:
        # create chat_room
        chat_room = create_chat_room(session, user.users_id, thread, result["topic"])
        if chat_room is None:
            response.status_code = 500
            return None
        else:
            print("chat room created ", chat_room)
    
    order : int = get_order(thread)
    # create chat
    # TODO: it's dangerous if one success and the other not, it'll cause mismatch in order, handle it by using transaction
    create_chat(session, thread, order, "human", data.message)
    create_chat(session, thread, order, "ai", str(result["messages"][-1].content))

    return {
        "message": result["messages"][-1].content,
        "thread": thread,
        "topic": result["topic"],
        "subtopic" : result["subtopic"],
        "references" : result["references"]
    }

@app.get("/chat")
def get_room_chat():
    return {"message": "Hello Chat"}

@app.get("/load/{thread_id}")
def load_chat(thread_id : str):
    return {"message" : "Hello Chat"}