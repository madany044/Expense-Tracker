import os
from flask import jsonify
from db import create_app, Base, engine
from sqlalchemy import text
from routes import api

app = create_app()
app.register_blueprint(api, url_prefix="/api")

@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return jsonify({"status": "ok", "db": "connected"}), 200
    except Exception as e:
        return jsonify({"status": "error", "db": str(e)}), 500

if __name__ == "__main__":
    with engine.begin() as conn:
        Base.metadata.create_all(bind=conn)
    port = int(os.getenv("PORT", 5001))
    app.run(host="127.0.0.1", port=port, debug=True)
