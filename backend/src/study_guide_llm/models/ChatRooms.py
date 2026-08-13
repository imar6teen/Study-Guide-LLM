import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

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

    users : uuid.UUID = Relationship(
        back_populates = "chatrooms"
    )

    chat_histories : list[uuid.UUID] = Relationship(
        back_populates = "chat_room", cascade_delete = True
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