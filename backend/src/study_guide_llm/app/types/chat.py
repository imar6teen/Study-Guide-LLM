from pydantic import BaseModel

class Chat(BaseModel):
    message : str
    thread : str | None