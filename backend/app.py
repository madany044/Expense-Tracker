import os
from flask_cors import CORS
from flask import jsonify
from db import create_app, Base, engine
from sqlalchemy import text
from flask_jwt_extended import JWTManager
from routes import api
from auth import auth
from flask_jwt_extended.exceptions import JWTExtendedException

app = create_app()

CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# === Defensive fallback: ensure header on every response (dev only) ===
@app.after_request
def _add_cors_headers(response):
    # dev-only: allow any origin so browser won't block requests during development
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers.setdefault("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.setdefault("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
    return response


# ensure CORS is explicitly enabled for API routes
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

app.register_blueprint(api, url_prefix="/api")
app.register_blueprint(auth, url_prefix="/api")

# configure JWT
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "change_this_in_prod")
jwt = JWTManager(app)

@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return jsonify({"status": "ok", "db": "connected"}), 200
    except Exception as e:
        return jsonify({"status": "error", "db": str(e)}), 500
    
@app.errorhandler(JWTExtendedException)
def handle_jwt_error(e):
    return jsonify({"error": "invalid_token", "details": str(e)}), 401

if __name__ == "__main__":
    with engine.begin() as conn:
        Base.metadata.create_all(bind=conn)
    port = int(os.getenv("PORT", 5001))
    app.run(host="127.0.0.1", port=port, debug=True)
