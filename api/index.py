from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import random

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

PLAYER_A_CARDS = [
    {"insect": "a-1", "score": 1, "image": "a-1.png"},
    {"insect": "a-2", "score": 2, "image": "a-2.png"},
    {"insect": "a-3", "score": 3, "image": "a-3.png"},
    {"insect": "a-4", "score": 4, "image": "a-4.png"}
]

PLAYER_B_CARDS = [
    {"insect": "b-1", "score": 1, "image": "b-1.png"},
    {"insect": "b-2", "score": 2, "image": "b-2.png"},
    {"insect": "b-3", "score": 3, "image": "b-3.png"},
    {"insect": "b-4", "score": 4, "image": "b-4.png"}
]

class GameState(BaseModel):
    player_a_cards: List[Dict[str, Any]]
    player_b_cards: List[Dict[str, Any]]
    result: str = ""
    round_results: List[Dict[str, Any]] = []
    player_a_score: int = 0
    player_b_score: int = 0
    game_over: bool = False

@app.get("/api/py/new_game")
def new_game():
    return {
        "player_a_cards": PLAYER_A_CARDS.copy(),
        "player_b_cards": PLAYER_B_CARDS.copy(),
        "round_results": [],
        "player_a_score": 0,
        "player_b_score": 0,
        "game_over": False
    }

@app.post("/api/py/compare")
async def compare_cards(card_a: dict, card_b: dict):
    score_a = card_a["score"]
    score_b = card_b["score"]
    
    result = {
        "card_a": card_a,
        "card_b": card_b,
        "result": "Deuce!",
        "winner": "Deuce"
    }
    
    if score_a > score_b:
        result.update({
            "result": "Player 1 wins!",
            "winner": "A"
        })
    elif score_b > score_a:
        result.update({
            "result": "Player 2 wins!",
            "winner": "B"
        })
    
    return result

@app.post("/api/py/calculate_final")
async def calculate_final(rounds: List[dict]):
    a_score = sum(1 for r in rounds if r["winner"] == "A")
    b_score = sum(1 for r in rounds if r["winner"] == "B")
    
    if a_score > b_score:
        return {"result": f"Player 1 Wins! {a_score}-{b_score}"}
    elif b_score > a_score:
        return {"result": f"Player 2 Wins! {a_score}-{b_score}"}
    return {"result": f"Deuce! {a_score}-{b_score}"}