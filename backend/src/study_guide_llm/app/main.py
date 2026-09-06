from langgraph.checkpoint.postgres import PostgresSaver
from fastapi import FastAPI, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from typing import Annotated
from starlette.middleware.sessions import SessionMiddleware
from langchain.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
import uuid

from study_guide_llm.configs import SECRET_KEY, MAX_AGE, FRONTEND_URI, DB_URI
from study_guide_llm.app.db import (
    get_session, 
    get_current_user, 
    create_chat_room, 
    create_chat, 
    get_order, 
    get_user_chat_rooms, 
    get_chat_history
)
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

    user_id = user["id"] if isinstance(user, dict) else getattr(user, "users_id", None)

    if data.thread is None:
        # create chat_room
        chat_room = create_chat_room(session, user_id, thread, result.get("topic"))
        if chat_room is None:
            response.status_code = 500
            return None
        else:
            print("chat room created ", chat_room)
    
    order : int = get_order(session, thread)
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
def get_room_chat(
    session : sessionDep, 
    response : Response, 
    user : Annotated[Users | None, Depends(get_current_user)]
):
    if user is None:
        response.status_code = 401
        return {"message": "Unauthorized"}

    user_id = user["id"] if isinstance(user, dict) else getattr(user, "users_id", None)
    if not user_id:
        response.status_code = 401
        return {"message": "Unauthorized"}

    rooms = get_user_chat_rooms(session, user_id)
    return [
        {
            "chatrooms_id": str(r[0]),
            "thread_id": str(r[0]),
            "room_name": r[1] if r[1] else "Untitled Chat",
            "timestamp": r[2],
            "updated_at": r[2]
        }
        for r in rooms
    ]

@app.get("/load/{thread_id}")
def load_chat(
    thread_id : str, 
    session : sessionDep, 
    response : Response, 
    user : Annotated[Users | None, Depends(get_current_user)]
):
    if user is None:
        response.status_code = 401
        return {"message": "Unauthorized"}

    user_id = user["id"] if isinstance(user, dict) else getattr(user, "users_id", None)
    if not user_id:
        response.status_code = 401
        return {"message": "Unauthorized"}

    chatroom, chats = get_chat_history(session, thread_id, user_id)
    if not chatroom:
        response.status_code = 404
        return {"message": "Chat room not found"}

    return {
        "chatrooms_id": str(chatroom.chatrooms_id),
        "thread_id": str(chatroom.chatrooms_id),
        "room_name": chatroom.room_name,
        "chats": [
            {
                "chats_id": str(c.chats_id),
                "id": str(c.chats_id),
                "chatrooms_id": str(c.chatrooms_id),
                "order": c.order,
                "type": c.type,
                "role": "user" if c.type == "human" else "ai",
                "content": c.content,
                "created_at": c.created_at,
                "updated_at": c.updated_at
            }
            for c in chats
        ]
    }