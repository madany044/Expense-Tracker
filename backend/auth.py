from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from db import SessionLocal
from models import User

auth = Blueprint("auth", __name__)

@auth.post("/auth/register")
def register():
    s = SessionLocal()
    body = request.get_json() or {}
    email = body.get("email")
    password = body.get("password")
    name = body.get("name")
    if not email or not password:
        s.close()
        return jsonify({"error": "email and password required"}), 400
    exists = s.query(User).filter(User.email == email).first()
    if exists:
        s.close()
        return jsonify({"error": "email already registered"}), 400
    pw_hash = generate_password_hash(password)
    u = User(email=email, password_hash=pw_hash, name=name)
    s.add(u)
    s.commit()
    s.refresh(u)
    s.close()
    return jsonify({"id": u.id, "email": u.email, "name": u.name}), 201

@auth.post("/auth/login")
def login():
    s = SessionLocal()
    body = request.get_json() or {}
    email = body.get("email"); password = body.get("password")
    u = s.query(User).filter(User.email == email).first()
    s.close()
    if not u or not check_password_hash(u.password_hash, password):
        return jsonify({"error": "invalid credentials"}), 401
    try:
        # ensure subject is string to avoid pyjwt subject errors
        token = create_access_token(identity=str(u.id))
    except Exception as ex:
        # helpful debug info in dev
        return jsonify({"error": "token_creation_failed", "details": str(ex)}), 500
    return jsonify({"access_token": token, "user": {"id": u.id, "email": u.email, "name": u.name}})
