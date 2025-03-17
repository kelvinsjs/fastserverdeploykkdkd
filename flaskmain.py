# app.py or flaskmain.py
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from apscheduler.schedulers.background import BackgroundScheduler
from characters import characters_bp
from clips import clips_bp
from models import db

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Настройки БД (SQLite)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///characters.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize SQLAlchemy with the Flask app
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(characters_bp)
    app.register_blueprint(clips_bp)

    ### === Создание БД при первом запуске === ###
    with app.app_context():
        db.create_all()
        from characters import update_daily_characters
        from clips import update_daily_clips
        update_daily_characters()
        update_daily_clips()

    ### === Запуск планировщика обновлений в 00:00 === ###
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_daily_characters, "cron", hour=0, minute=0, timezone="Europe/Moscow")
    scheduler.add_job(update_daily_clips, "cron", hour=0, minute=0, timezone="Europe/Moscow")
    scheduler.start()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
