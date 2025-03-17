# clips.py
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta, timezone
import random
import json
from models import DailyClips, db  # Import DailyClips here

clips_bp = Blueprint('clips', __name__)

CLIPS_FILE_PATH = "./anime_clipss.json"

def load_clips():
    try:
        with open(CLIPS_FILE_PATH, 'r', encoding='utf-8') as file:
            data = json.load(file)
            return data
    except Exception as e:
        print("Ошибка загрузки JSON:", e)
        return []

def update_daily_clips():
    today = datetime.now(timezone.utc) + timedelta(hours=3)
    today_str = today.strftime("%Y-%m-%d")

    existing_entry = DailyClips.query.filter_by(date=today_str).first()
    if existing_entry:
        return

    clips = load_clips()

    if not clips:
        print("Ошибка: не удалось получить новые клипы")
        return

    len_clips = len(clips)
    easy_clip = clips[random.randint(0, len_clips // 3 - 1)]
    medium_clip = clips[random.randint(len_clips // 3, 2 * len_clips // 3 - 1)]
    hard_clip = clips[random.randint(2 * len_clips // 3, len_clips - 1)]

    new_entry = DailyClips(
        date=today_str,
        clips_json=json.dumps({
            "easy": easy_clip,
            "medium": medium_clip,
            "hard": hard_clip
        })
    )
    db.session.add(new_entry)
    db.session.commit()
    print(f"Обновлены клипы на {today_str}")

@clips_bp.route('/api/clip/start', methods=['GET'])
def start_clip_game():
    today = datetime.now(timezone.utc) + timedelta(hours=3)
    today_str = today.strftime("%Y-%m-%d")

    entry = DailyClips.query.filter_by(date=today_str).first()
    if not entry:
        update_daily_clips()
        entry = DailyClips.query.filter_by(date=today_str).first()

    clips = entry.to_dict()
    return jsonify({
        "easy": clips.get("easy", {}),
        "medium": clips.get("medium", {}),
        "hard": clips.get("hard", {})
    })

@clips_bp.route('/api/clip/clue', methods=['POST'])
def get_clip_clue():
    data = request.json
    difficulty = data.get("difficulty")
    clue_index = data.get("clue_index", 0)

    today = datetime.now(timezone.utc) + timedelta(hours=3)
    today_str = today.strftime("%Y-%m-%d")

    entry = DailyClips.query.filter_by(date=today_str).first()
    if not entry:
        return jsonify({"error": "Нет данных клипов"}), 500

    clips = entry.to_dict()
    clip = clips.get(difficulty, {})

    if not clip or clue_index >= len(clip.get("screenshots", [])):
        return jsonify({"error": "Неверный уровень сложности или индекс подсказки"}), 400

    return jsonify({
        "screenshot": clip["screenshots"][clue_index]
    })

@clips_bp.route('/api/clip/titles', methods=['GET'])
def get_clip_titles():
    clips = load_clips()
    titles = [clip['title'] for clip in clips]
    return jsonify(titles)
