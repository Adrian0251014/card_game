// page.tsx
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
  "ladybug1": 1,
  "ladybug2": 1,
  "ladybug3": 1,
  "ladybug4": 1,
  "monarch1": 1,
  "monarch2": 1,
  "monarch3": 1,
  "monarch4": 1
};

const CARD_REFERENCE = {
  "ladybug1": { score: 1, image: "ladybug1.png" },
  "ladybug2": { score: 2, image: "ladybug2.png" },
  "ladybug3": { score: 3, image: "ladybug3.png" },
  "ladybug4": { score: 4, image: "ladybug4.png" },
  "monarch1": { score: 1, image: "monarch1.png" },
  "monarch2": { score: 2, image: "monarch2.png" },
  "monarch3": { score: 3, image: "monarch3.png" },
  "monarch4": { score: 4, image: "monarch4.png" }
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
  const [showReference, setShowReference] = useState(false);

  const ReferenceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Card Reference</h2>
          <button
            onClick={() => setShowReference(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(CARD_REFERENCE).map(([name, info]) => (
            <div key={name} className="flex flex-col items-center p-2 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="relative w-full aspect-[3/4] max-w-[150px]">
                <Image
                  src={`/${info.image}`}
                  alt={name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const startNewGame = async () => {
    const res = await fetch('/api/py/new_game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ common_deck: config })
    });
    const data = await res.json();
    
    setGameState({
      ...data,
      result: '',
      round_results: []
    });
    setCurrentCards({ a: null, b: null });
    setShowConfig(false);
  };

  const playRound = async () => {
    const res = await fetch('/api/py/play_round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameState)
    });
    
    const { new_a_deck, new_b_deck, round_result, used_card_a, used_card_b, all_cards_used } = await res.json();
    
    setCurrentCards({
      a: used_card_a,
      b: used_card_b
    });

    let newState = {
      ...gameState,
      player_a_deck: new_a_deck,
      player_b_deck: new_b_deck,
      player_a_score: round_result?.winner === 'A' ? gameState.player_a_score + 1 : gameState.player_a_score,
      player_b_score: round_result?.winner === 'B' ? gameState.player_b_score + 1 : gameState.player_b_score,
      round_results: [...gameState.round_results, round_result],
      game_over: all_cards_used,
      result: round_result?.result || gameState.result,
      player_a_sequence: [...gameState.player_a_sequence, used_card_a],
      player_b_sequence: [...gameState.player_b_sequence, used_card_b]
    };

    if (all_cards_used) {
      const finalRes = await fetch('/api/py/end_game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState)
      });
      const finalData = await finalRes.json();
      newState.result = finalData.result;
      newState.game_over = true;
    }

    setGameState(newState);
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
                  End Game Early
                </button>

                <button
                  onClick={() => {
                    setShowConfig(true);
                    setCurrentCards({ a: null, b: null });
                  }}
                  className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Reconfigure
                </button>

                <button
                  onClick={() => setShowReference(true)}
                  className="py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Show Reference
                </button>
              </div>

              {gameState.result && (
                <div className="mt-6 p-3 bg-white rounded-lg text-center animate-fade-in">
                  <span className="font-bold text-lg">
                    {gameState.game_over ? 
                    gameState.result : 
                    `${gameState.result}`}
                  </span>
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

      {showReference && <ReferenceModal />}
    </main>
  );
}