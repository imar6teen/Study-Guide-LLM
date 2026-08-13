import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

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

    chat_room : uuid.UUID = Relationship(
        back_populates = "chat_histories"
    )