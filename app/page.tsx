'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Card {
  insect: string;
  score: number;
  image: string;
}

interface GameState {
  player_a_deck: Card[];
  player_b_deck: Card[];
  result: string;
  player_a_score: number;
  player_b_score: number;
  game_over: boolean;
  round_results: Array<{
    card_a: Card;
    card_b: Card;
    winner: string;
    result: string;
  }>;
  player_a_sequence: Card[];
  player_b_sequence: Card[];
}

const DEFAULT_CONFIG = {
  "a-1": 1,
  "a-2": 1,
  "a-3": 1,
  "a-4": 1,
  "b-1": 1,
  "b-2": 1,
  "b-3": 1,
  "b-4": 1
};

export default function Home() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [gameState, setGameState] = useState<GameState>({
    player_a_deck: [],
    player_b_deck: [],
    result: '',
    player_a_score: 0,
    player_b_score: 0,
    game_over: false,
    round_results: [],
    player_a_sequence: [],
    player_b_sequence: []
  });
  
  const [currentCards, setCurrentCards] = useState<{
    a: Card | null;
    b: Card | null;
  }>({ a: null, b: null });
  const [showConfig, setShowConfig] = useState(true);

  const startNewGame = async () => {
    const res = await fetch('/api/py/new_game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ common_deck: config })
    });
    const data = await res.json();
    setGameState(data);
    setShowConfig(false);
  };

  const playRound = async () => {
    const res = await fetch('/api/py/play_round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameState)
    });
    
    const { new_a_deck, new_b_deck, round_result, used_card_a, used_card_b } = await res.json();
    
    setCurrentCards({
      a: used_card_a,
      b: used_card_b
    });

    setGameState(prev => ({
      ...prev,
      player_a_deck: new_a_deck,
      player_b_deck: new_b_deck,
      player_a_score: round_result?.winner === 'A' ? prev.player_a_score + 1 : prev.player_a_score,
      player_b_score: round_result?.winner === 'B' ? prev.player_b_score + 1 : prev.player_b_score,
      round_results: [...prev.round_results, round_result],
      game_over: new_a_deck.length === 0 || new_b_deck.length === 0,
      result: round_result?.result || prev.result,
      player_a_sequence: [...prev.player_a_sequence, used_card_a],
      player_b_sequence: [...prev.player_b_sequence, used_card_b]
    }));
  };

  const endGame = async () => {
    const res = await fetch('/api/py/end_game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameState)
    });
    const data = await res.json();
    setGameState(prev => ({
      ...prev,
      game_over: true,
      result: data.result
    }));
  };

  const updateConfig = (card: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      [card]: Math.max(0, value)
    }));
  };

  return (
    <main className="flex min-h-screen p-4 gap-6 bg-slate-100">
      {showConfig ? (
        <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Card Configuration</h2>
          <div className="space-y-4">
            {Object.keys(DEFAULT_CONFIG).map(card => (
              <div key={card} className="flex items-center justify-between">
                <label className="w-24 flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <Image
                      src={`/${card}.png`}
                      alt={card}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {card}
                </label>
                <input
                  type="number"
                  min="0"
                  value={config[card]}
                  onChange={e => updateConfig(card, parseInt(e.target.value))}
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
            ))}
          </div>
          <button
            onClick={startNewGame}
            className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
          >
            Start Game
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col bg-white rounded-xl p-4 shadow-xl">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Player 1</h2>
              <div>Cards Left: {gameState.player_a_deck.length}</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-6">
              <div className="w-48 h-72 border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center">
                {currentCards.a && (
                  <div className="relative w-full h-full animate-card-flip">
                    <Image
                      src={`/${currentCards.a.image}`}
                      alt={currentCards.a.insect}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-72 flex flex-col gap-4 justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-6">
                {gameState.player_a_score} : {gameState.player_b_score}
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={playRound}
                  disabled={gameState.game_over}
                  className="py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {gameState.game_over ? 'Game Over' : 'Play Round'}
                </button>
                
                <button
                  onClick={endGame}
                  disabled={gameState.game_over}
                  className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  End Game
                </button>

                <button
                  onClick={() => setShowConfig(true)}
                  className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Restart
                </button>
              </div>

              {gameState.result && (
                <div className="mt-6 p-3 bg-white rounded-lg text-center animate-fade-in">
                  <span className="font-bold text-lg">{gameState.result}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white rounded-xl p-4 shadow-xl">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Player 2</h2>
              <div>Cards Left: {gameState.player_b_deck.length}</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-6">
              <div className="w-48 h-72 border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center">
                {currentCards.b && (
                  <div className="relative w-full h-full animate-card-flip">
                    <Image
                      src={`/${currentCards.b.image}`}
                      alt={currentCards.b.insect}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}