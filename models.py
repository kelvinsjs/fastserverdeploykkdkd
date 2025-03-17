# models.py
from flask_sqlalchemy import SQLAlchemy
import json

db = SQLAlchemy()

class DailyCharacters(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(10), unique=True, nullable=False)
    characters_json = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return json.loads(self.characters_json)

class DailyClips(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(10), unique=True, nullable=False)
    clips_json = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return json.loads(self.clips_json)
