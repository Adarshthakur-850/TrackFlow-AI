import pytest
from app.core.database import Base, engine, SessionLocal
from app.api.v1.simulation import seed_demo_data

@pytest.fixture(scope="session", autouse=True)
def setup_database_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_demo_data(db)
    db.close()
    yield
