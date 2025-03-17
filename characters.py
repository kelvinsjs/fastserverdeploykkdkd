# characters.py
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta, timezone
import random
import json
import requests
from models import DailyCharacters, db
import os


characters_bp = Blueprint('characters', __name__)


BASE_DIR = os.path.abspath(os.path.dirname(__file__))
json_path = os.path.join(BASE_DIR, "character_data.json")

def get_random_characters(count):
    try:
        # Open and read the local JSON file
        with open(json_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        if not isinstance(data, list) or len(data) == 0:
            return []

        return random.sample(data, min(count, len(data)))
    except Exception as e:
        print("Ошибка загрузки JSON:", e)
        return []

def update_daily_characters():
    today = datetime.now(timezone.utc) + timedelta(hours=3)
    today_str = today.strftime("%Y-%m-%d")

    existing_entry = DailyCharacters.query.filter_by(date=today_str).first()
    if existing_entry:
        return

    characters = get_random_characters(50)

    if not characters:
        print("Ошибка: не удалось получить новых персонажей")
        return

    max_rank = max(char["rank"] for char in characters)

    easy_chars = [char for char in characters if char["rank"] <= max_rank // 3]
    medium_chars = [char for char in characters if max_rank // 3 < char["rank"] <= 2 * max_rank // 3]
    hard_chars = [char for char in characters if 2 * max_rank // 3 < char["rank"] <= max_rank]

    easy_chars = easy_chars[:4]
    medium_chars = medium_chars[:4]
    hard_chars = hard_chars[:4]

    if not easy_chars or not medium_chars or not hard_chars:
        print("Ошибка: не удалось получить достаточное количество персонажей")
        return

    new_entry = DailyCharacters(
        date=today_str,
        characters_json=json.dumps({
            "easy": easy_chars,
            "medium": medium_chars,
            "hard": hard_chars
        })
    )
    db.session.add(new_entry)
    db.session.commit()
    print(f"Обновлены персонажи на {today_str}")

@characters_bp.route('/api/start', methods=['GET'])
def start_game():
    today = datetime.now(timezone.utc) + timedelta(hours=3)
    today_str = today.strftime("%Y-%m-%d")

    entry = DailyCharacters.query.filter_by(date=today_str).first()
    if not entry:
        update_daily_characters()
        entry = DailyCharacters.query.filter_by(date=today_str).first()

    characters = entry.to_dict()
    return jsonify({
        "easy": characters.get("easy", []),
        "medium": characters.get("medium", []),
        "hard": characters.get("hard", [])
    })

@characters_bp.route('/api/check', methods=['POST'])
def check_answers():
    user_answers = request.json.get("answers", [])
    round_type = request.json.get("round", "easy")

    today = datetime.utcnow() + timedelta(hours=3)
    today_str = today.strftime("%Y-%m-%d")

    entry = DailyCharacters.query.filter_by(date=today_str).first()
    if not entry:
        return jsonify({"error": "Нет данных персонажей"}), 500

    correct_characters = entry.to_dict().get(round_type, [])

    if not correct_characters:
        return jsonify({"error": f"Нет персонажей для уровня сложности {round_type}"}), 500

    results = []
    for user_answer, correct in zip(user_answers, correct_characters):
        is_correct = (user_answer["name"].lower() == correct["name"].lower() and
                      user_answer["affiliation"].lower() == (f'{correct["affiliation"]}').lower())

        results.append({
            "correct_name": correct["name"],
            "correct_affiliation": f'{correct["affiliation"]}',
            "correct": is_correct
        })

    return jsonify(results)

@characters_bp.route('/api/all_characters', methods=['GET'])
def get_all_characters():
    try:
        # Open and read the local JSON file
        with open(json_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        if not isinstance(data, list):
            return jsonify({"error": "Неверный формат данных"}), 500

        all_characters = data
        all_affiliations = list(set(f"{char['affiliation']}" for char in data))

        return jsonify({
            "allChars": all_characters,
            "allAffiliations": all_affiliations
        })
    except Exception as e:
        print("Ошибка загрузки JSON:", e)
        return jsonify({"error": "Ошибка загрузки данных"}), 500