from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import random

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

class GameConfig(BaseModel):
    common_deck: Dict[str, int]

class GameState(BaseModel):
    player_a_deck: List[Dict[str, Any]]
    player_b_deck: List[Dict[str, Any]]
    result: str = ""
    round_results: List[Dict[str, Any]] = []
    player_a_score: int = 0
    player_b_score: int = 0
    game_over: bool = False
    player_a_sequence: List[Dict[str, Any]] = []
    player_b_sequence: List[Dict[str, Any]] = []

BASE_CARDS = {
    "ladybug1": {"insect": "ladybug1", "score": 1, "image": "ladybug1.png"},
    "ladybug2": {"insect": "ladybug2", "score": 2, "image": "ladybug2.png"},
    "ladybug3": {"insect": "ladybug3", "score": 3, "image": "ladybug3.png"},
    "ladybug4": {"insect": "ladybug4", "score": 4, "image": "ladybug4.png"},
    "monarch1": {"insect": "monarch1", "score": 1, "image": "monarch1.png"},
    "monarch2": {"insect": "monarch2", "score": 2, "image": "monarch2.png"},
    "monarch3": {"insect": "monarch3", "score": 3, "image": "monarch3.png"},
    "monarch4": {"insect": "monarch4", "score": 4, "image": "monarch4.png"}
}

def build_deck(config: Dict[str, int]) -> List[Dict[str, Any]]:
    deck = []
    for card_id, count in config.items():
        if card_id in BASE_CARDS and count > 0:
            deck += [BASE_CARDS[card_id].copy() for _ in range(count)]
    random.shuffle(deck)
    return deck

@app.post("/api/py/new_game")
async def new_game(config: GameConfig):
    deck = build_deck(config.common_deck)
    return {
        "player_a_deck": deck.copy(),
        "player_b_deck": deck.copy(),
        "round_results": [],
        "player_a_score": 0,
        "player_b_score": 0,
        "game_over": False,
        "player_a_sequence": [],
        "player_b_sequence": []
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
        result.update({"result": "Player 1 wins!", "winner": "A"})
    elif score_b > score_a:
        result.update({"result": "Player 2 wins!", "winner": "B"})
    
    return result

@app.post("/api/py/play_round")
async def play_round(state: GameState):
    if state.game_over:
        return {"error": "Game already ended"}
    
    if not state.player_a_deck or not state.player_b_deck:
        return {"error": "No cards remaining"}
    
    a_index = random.randrange(len(state.player_a_deck))
    card_a = state.player_a_deck[a_index]
    new_a_deck = [c for i, c in enumerate(state.player_a_deck) if i != a_index]
    
    b_index = random.randrange(len(state.player_b_deck))
    card_b = state.player_b_deck[b_index]
    new_b_deck = [c for i, c in enumerate(state.player_b_deck) if i != b_index]
    
    result = await compare_cards(card_a, card_b)
    all_cards_used = len(new_a_deck) == 0 and len(new_b_deck) == 0
    
    return {
        "new_a_deck": new_a_deck,
        "new_b_deck": new_b_deck,
        "round_result": result,
        "used_card_a": card_a,
        "used_card_b": card_b,
        "all_cards_used": all_cards_used
    }

@app.post("/api/py/end_game")
async def end_game(state: GameState):
    a_score = sum(1 for r in state.round_results if r["winner"] == "A")
    b_score = sum(1 for r in state.round_results if r["winner"] == "B")
    
    if a_score > b_score:
        return {"result": f"Player 1 Wins! ({a_score}-{b_score})"}
    elif b_score > a_score:
        return {"result": f"Player 2 Wins! ({a_score}-{b_score})"}
    return {"result": f"Deuce! ({a_score}-{b_score})"}