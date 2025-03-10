'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Card {
  insect: string;
  score: number;
  image: string;
}

interface GameState {
  player_a_cards: Card[];
  player_b_cards: Card[];
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
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>({
    player_a_cards: [],
    player_b_cards: [],
    result: '',
    player_a_score: 0,
    player_b_score: 0,
    game_over: false,
    round_results: []
  });
  
  const [currentCards, setCurrentCards] = useState<{
    a: Card | null;
    b: Card | null;
  }>({ a: null, b: null });

  const startNewGame = async () => {
    const res = await fetch('/api/py/new_game');
    const data = await res.json();
    setGameState({
      ...data,
      result: '',
      round_results: []
    });
    setCurrentCards({ a: null, b: null });
  };

  const playRound = async () => {
    if (gameState.game_over || gameState.player_a_cards.length === 0) return;

    const getRandomCard = (cards: Card[]) => 
      cards[Math.floor(Math.random() * cards.length)];
    
    const cardA = getRandomCard(gameState.player_a_cards);
    const cardB = getRandomCard(gameState.player_b_cards);

    setCurrentCards({ a: cardA, b: cardB });

    const res = await fetch('/api/py/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_a: cardA, card_b: cardB }),
    });
    const result = await res.json();

    setGameState(prev => {
      const newState = {
        ...prev,
        player_a_cards: prev.player_a_cards.filter(c => c !== cardA),
        player_b_cards: prev.player_b_cards.filter(c => c !== cardB),
        round_results: [...prev.round_results, result],
        player_a_score: result.winner === 'A' ? prev.player_a_score + 1 : prev.player_a_score,
        player_b_score: result.winner === 'B' ? prev.player_b_score + 1 : prev.player_b_score,
        result: result.result,
        game_over: prev.player_a_cards.length === 1
      };

      if (newState.game_over) {
        fetch('/api/py/calculate_final', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newState.round_results)
        }).then(r => r.json())
          .then(({ result }) => {
            setGameState(p => ({ ...p, result }));
          });
      }
      return newState;
    });
  };

  useEffect(() => {
    startNewGame();
  }, []);

  return (
    <main className="flex min-h-screen p-4 gap-6 bg-slate-100 dark:bg-slate-900">
      {/* Left */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Player 1</h2>
          <div className="font-mono text-lg">Score: {gameState.player_a_score}</div>
        </div>
        
        <div className="flex-1 flex flex-col items-center gap-4">
          {currentCards.a && (
            <div className="relative w-24 h-36 animate-card-flip">
              <Image
                src={`/${currentCards.a.image}`}
                alt={currentCards.a.insect}
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 justify-center">
            {gameState.player_a_cards.map((_, i) => (
              <div key={i} className="w-20 h-28 bg-slate-200 rounded-md border-2 border-dashed border-slate-400" />
            ))}
          </div>
        </div>
      </div>

      {/* Middle */}
      <div className="w-72 flex flex-col gap-4 justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-6">
            {gameState.player_a_score} : {gameState.player_b_score}
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={playRound}
              disabled={gameState.game_over || gameState.player_a_cards.length === 0}
              className="py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              {gameState.game_over ? 'Game Over' : `Play Round (${gameState.player_a_cards.length})`}
            </button>
            
            <button
              onClick={startNewGame}
              className="py-2 px-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              New Game
            </button>
          </div>

          {gameState.result && (
            <div className="mt-6 p-3 bg-white dark:bg-slate-800 rounded-lg text-center animate-fade-in">
              <span className="font-bold text-lg">{gameState.result}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Player 2</h2>
          <div className="font-mono text-lg">Score: {gameState.player_b_score}</div>
        </div>
        
        <div className="flex-1 flex flex-col items-center gap-4">
          {currentCards.b && (
            <div className="relative w-24 h-36 animate-card-flip">
              <Image
                src={`/${currentCards.b.image}`}
                alt={currentCards.b.insect}
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 justify-center">
            {gameState.player_b_cards.map((_, i) => (
              <div key={i} className="w-20 h-28 bg-slate-200 rounded-md border-2 border-dashed border-slate-400" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}