from starlette.requests import Request
from typing import Literal
from study_guide_llm.models import Users
from sqlmodel import SQLModel, Session, create_engine, select, text

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

# depdends function
def get_current_user(request : Request) -> Users | None:
    user = request.session.get("user")

    # update session
    request.session["user"] = user

    if user is not None:
        return user
    
    return None