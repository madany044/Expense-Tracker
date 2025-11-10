from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()  # loads .env in development

Base = declarative_base()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=False, future=True)

SessionLocal = scoped_session(
    sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
)

def create_app():
    app = Flask(__name__)
    CORS(app)  # allow local React dev server for later
    return app
