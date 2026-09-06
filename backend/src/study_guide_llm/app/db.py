from starlette.requests import Request
from typing import Literal
from study_guide_llm.models import Users, ChatRooms, Chats
from sqlmodel import SQLModel, Session, create_engine, select, text, func, desc
import uuid

from study_guide_llm.configs import DB_URI, APP_ENV

engine = create_engine(DB_URI)



def check_connection():
    if APP_ENV != "dev":
        print("Connecting to the database...")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Connection successful")


# def create_db_and_tables():
#     SQLModel.metadata.create_all(engine)

check_connection()

def get_session() -> Session:
    with Session(engine) as session:
        yield session

def is_user_exist(session: Session, type : Literal["email", "username"], value : str):
    
    if type == "email":
        data : Users | None = session.exec(select(Users).where(Users.email == value)).first()
    
    else:
        data : Users | None = session.exec(select(Users).where(Users.username == value)).first()

    return bool(data)

def delete_user(session : Session, email : str):
    try:
        data : Users | None = session.exec(select(Users).where(Users.email == email)).first()
        if not data:
            return False
        session.delete(data)
        session.commit()
        return True
    except Exception as e:
        print(e)
        return False
    
def verify_user(session : Session, email : str):
    try:
        data : Users | None = session.exec(select(Users).where(Users.email == email)).first()
        if not data:
            return False
        data.email_verified = True
        session.add(data)
        session.commit()
        return True
    except Exception as e:
        print(e)
        return False

def create_chat_room(session : Session, user_id : str | uuid.UUID, thread_id : str | uuid.UUID, room_name : str | None) -> ChatRooms | None:
    try:
        formatted_name = (room_name[:30] if room_name else "New Chat")
        data : ChatRooms = ChatRooms(users_id=user_id, chatrooms_id=thread_id, room_name=formatted_name)
        session.add(data)
        session.commit()
        return data
    except Exception as e:
        print(e)
        return None

def create_chat(session : Session, thread_id : str | uuid.UUID, order : int, type : Literal["human", "ai"], content : str) -> Chats | None:
    try:
        data : Chats = Chats(
            chatrooms_id=thread_id,
            order=order,
            type=type,
            content=content
        )
        session.add(data)
        session.commit()
        return data
    except Exception as e:
        print(e)
        return None

def get_order(session : Session, thread_id : str | uuid.UUID):
    data : Chats | None = session.exec(
        select(Chats).where(Chats.chatrooms_id == thread_id).order_by(Chats.order.desc())
    ).first()

    if not data:
        return 1
    
    return data.order + 1

def get_user_chat_rooms(session : Session, user_id : str | uuid.UUID):
    try:
        latest_timestamp = func.coalesce(func.max(Chats.updated_at), ChatRooms.updated_at).label("latest_updated_at")

        statement = (
            select(
                ChatRooms.chatrooms_id,
                ChatRooms.room_name,
                latest_timestamp
            )
            .outerjoin(Chats, ChatRooms.chatrooms_id == Chats.chatrooms_id)
            .where(
                ChatRooms.users_id == user_id,
                ChatRooms.deleted_at == None
            )
            .group_by(ChatRooms.chatrooms_id, ChatRooms.room_name, ChatRooms.updated_at)
            .order_by(desc(latest_timestamp))
        )

        return session.exec(statement).all()
    except Exception as e:
        print(e)
        return []

def get_chat_history(session : Session, thread_id : str | uuid.UUID, user_id : str | uuid.UUID):
    try:
        chatroom = session.exec(
            select(ChatRooms).where(
                ChatRooms.chatrooms_id == thread_id,
                ChatRooms.users_id == user_id,
                ChatRooms.deleted_at == None
            )
        ).first()

        if not chatroom:
            return None, []

        chats = session.exec(
            select(Chats)
            .where(Chats.chatrooms_id == chatroom.chatrooms_id)
            .order_by(Chats.order.asc(), Chats.created_at.asc())
        ).all()

        return chatroom, list(chats)
    except Exception as e:
        print(e)
        return None, []

# depends function
def get_current_user(request : Request) -> Users | None:
    user = request.session.get("user")

    # update session
    request.session["user"] = user

    if user is not None:
        return user
    
    return None