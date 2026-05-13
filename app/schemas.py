from datetime import datetime

from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    balance: float = 0.0


class UserResponse(BaseModel):
    id: int
    name: str
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    amount: float
    type: str
    category: str
    description: str | None = None
    date: datetime | None = None


class TransactionResponse(BaseModel):
    id: int
    amount: float
    type: str
    category: str
    description: str | None
    date: datetime
    owner_id: int

    class Config:
        from_attributes = True


class GoalCreate(BaseModel):
    title: str
    target_amount: float
    current_amount: float = 0.0
    deadline: datetime | None = None


class GoalResponse(BaseModel):
    id: int
    title: str
    target_amount: float
    current_amount: float
    deadline: datetime | None
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True


class AIParseRequest(BaseModel):
    message: str


class AIParseResponse(BaseModel):
    reply: str
    action_taken: bool
    transaction: TransactionResponse | None = None
