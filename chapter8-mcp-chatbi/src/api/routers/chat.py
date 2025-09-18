from typing import List  # Optional is not used, can be removed

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.api.database import get_db
from src.api.models import Conversation, Message, Visualization
from src.api.services.chat_service import process_chat_message

router = APIRouter()


class MessageCreate(BaseModel):
    content: str
    role: str = "user"


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str

    class Config:
        orm_mode = True  # In Pydantic v2, orm_mode is deprecated, use from_attributes = True


class ConversationCreate(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: int
    title: str
    messages: List[MessageResponse] = []

    class Config:
        orm_mode = True  # In Pydantic v2, orm_mode is deprecated, use from_attributes = True


class VisualizationResponse(BaseModel):
    id: int
    title: str
    chart_type: str
    chart_data: dict

    class Config:
        orm_mode = True  # In Pydantic v2, orm_mode is deprecated, use from_attributes = True


@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(conversation: ConversationCreate, db: Session = Depends(get_db)):
    # For simplicity, we're using user_id=1 (admin user)
    db_conversation = Conversation(title=conversation.title, user_id=1)
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation


@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(db: Session = Depends(get_db)):
    # For simplicity, we're using user_id=1 (admin user)
    conversations = db.query(Conversation).filter(Conversation.user_id == 1).order_by(Conversation.id.desc()).all()
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def create_message(
        conversation_id: int,
        message: MessageCreate,
        db: Session = Depends(get_db)
):
    # Check if conversation exists
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save user message
    db_message = Message(
        conversation_id=conversation_id,
        role=message.role,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    # Get all messages in the conversation for context
    messages_from_db = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(
        Message.created_at).all()
    message_history = [{"role": msg.role, "content": msg.content} for msg in messages_from_db]

    # Process the message with the AI
    response_content, visualizations = await process_chat_message(message_history, db)

    # Save AI response
    ai_message = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=response_content
    )
    db.add(ai_message)

    # Save any visualizations
    if visualizations:  # Check if visualizations list is not empty
        for viz in visualizations:
            db_viz = Visualization(
                conversation_id=conversation_id,
                title=viz.get("title", "Untitled Visualization"),  # Use .get for safety
                chart_type=viz.get("chart_type", "unknown"),  # Use .get for safety
                chart_data=viz.get("chart_data", {})  # Use .get for safety
            )
            db.add(db_viz)

    db.commit()
    db.refresh(ai_message)  # Refresh ai_message to get its ID for the response

    # Update conversation title if it's the first user message (now second message overall)
    if len(messages_from_db) == 1:  # This means only the user's first message was in db before this function call
        new_title = message.content[:50]
        if len(message.content) > 50:
            new_title += "..."
        conversation.title = new_title
        db.commit()

    return ai_message


@router.get("/conversations/{conversation_id}/visualizations", response_model=List[VisualizationResponse])
def get_visualizations(conversation_id: int, db: Session = Depends(get_db)):
    visualizations = db.query(Visualization).filter(Visualization.conversation_id == conversation_id).all()
    return visualizations
