import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from study_guide_llm.configs.db import DEFAULT_IMAGE
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

    chatrooms : list[uuid.UUID] = Relationship(
        back_populates = "users", cascade_delete = True
    )

    created_at : datetime = Field(
        default = datetime.now(),
        nullable = False,
    )

    updated_at : datetime = Field(
        default = datetime.now(),
        nullable = False,
    )

    