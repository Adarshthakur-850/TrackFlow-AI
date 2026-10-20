from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.schemas_db import Notification

class NotificationService:
    @staticmethod
    def send_notification(
        db: Session,
        recipient: str,
        channel: str,
        event_type: str,
        subject: str,
        body: str,
        idempotency_key: Optional[str] = None
    ) -> Notification:
        # Check idempotency
        if idempotency_key:
            existing = db.query(Notification).filter(Notification.idempotency_key == idempotency_key).first()
            if existing:
                return existing

        notif = Notification(
            recipient_email_or_phone=recipient,
            channel=channel,
            event_type=event_type,
            subject=subject,
            message_body=body,
            sent_at=datetime.now(timezone.utc),
            delivery_status="DELIVERED",
            idempotency_key=idempotency_key
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
