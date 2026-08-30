import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from study_guide_llm.configs import DEFAULT_IMAGE
from typing import Optional

class Users(SQLModel, table = True):
    users_id : uuid.UUID = Field(
        default_factory = uuid.uuid4,
        primary_key = True,
        index = True,
        nullable = False,
    )

    name : str = Field(
        nullable = False,
        index = True,
    )

    email : str = Field(
        index = True,
        unique = True,
        nullable = False,
    )

    username : str = Field(
        index = True,
        nullable = False,
    )

    password : str = Field(
        nullable = False,
    )

    img_filename : Optional[str] = Field(
        nullable = True,
        default = DEFAULT_IMAGE
    )

    email_verified : bool = Field(
        default = False,
        nullable = False,
    )

    created_at : datetime = Field(
        default = datetime.now(),
        nullable = False,
    )

    updated_at : datetime = Field(
        default = datetime.now(),
        nullable = False,
    )

    chatrooms : list["ChatRooms"] = Relationship(
        back_populates = "users", cascade_delete = True
    )
    

class ChatRooms(SQLModel, table = True):
    chatrooms_id : uuid.UUID = Field(
        default_factory = uuid.uuid4,
        primary_key = True,
        index = True,
        nullable = True
    )

    users_id : uuid.UUID = Field(
        index = True,
        nullable = True,
        foreign_key = "users.users_id",
        description = "Users ID",
        # Implement soft delete but use this in case hard delete happened
        ondelete = "CASCADE"
    )

    room_name : str = Field(
        nullable = True,
        max_length = 30,
    )

    created_at : datetime = Field(
        default = datetime.now(),
        nullable = False,
    )

    updated_at : datetime = Field(
        default = datetime.now(),
        nullable = False,
    )

    deleted_at : datetime = Field(
        nullable = True
    )

    users : Users | None = Relationship(
        back_populates = "chatrooms"
    )

    chat_histories : list["Chats"] = Relationship(
        back_populates = "chat_room", cascade_delete = True
    )

class Chats(SQLModel, table = True):
    chats_id : uuid.UUID = Field(
        default_factory = uuid.uuid4,
        primary_key = True,
        index = True,
        nullable = False,
    )

    chatrooms_id : uuid.UUID = Field(
        index = True,
        nullable = False,
        foreign_key = "chatrooms.chatrooms_id",
        ondelete = "CASCADE"
    )

    order : int = Field(
        default = 0,
        nullable = False,
    )

    type : str = Field(
        nullable = False,
        description = "User or LLM or System"
    )

    content : str = Field(
        nullable = False,
    )

    created_at : datetime = Field(
        default = datetime.now(),
        nullable = False,
    )

    updated_at : datetime = Field(
        default = datetime.now(),
        nullable = False,
    )

    chat_room : ChatRooms = Relationship(
        back_populates = "chat_histories"
    )