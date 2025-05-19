'use client';
import { useState, useEffect } from 'react';

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
  player_a_discard: Card[];
  player_b_discard: Card[];
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


const INTRODUCTION_STEPS = 4;
const CARD_ASPECT_RATIO = 1506 / 2106;
const REFERENCE_ASPECT_RATIO = 3602 / 1008;

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showIntroduction, setShowIntroduction] = useState(true);
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
    player_b_sequence: [],
    player_a_discard: [],
    player_b_discard: []
  });

  const [currentCards, setCurrentCards] = useState<{
    a: Card | null;
    b: Card | null;
  }>({ a: null, b: null });
  const [showConfig, setShowConfig] = useState(false);
  const [waitingForComparison, setWaitingForComparison] = useState(false);
  const [showFinalResult, setShowFinalResult] = useState(false);

  const renderIntroduction = () => {
    switch(currentStep) {
      case 0:
        return (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-6xl">
              <div className="relative w-64 h-64 md:w-96 md:h-96">
                <img 
                  src="/character.png" 
                  alt="Guide" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="relative bg-white p-8 rounded-3xl shadow-xl max-w-2xl w-full text-center">
                <p className="text-2xl md:text-3xl text-gray-800 leading-relaxed">
                  You are going to play a card game called Circle of Life.
                </p>
                <div className="absolute -left-6 top-12 w-12 h-12 bg-white transform rotate-45" />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-6xl mb-12">
              <div className="relative w-48 h-48">
                <img src="/character.png" alt="Guide" className="w-full h-full object-contain" />
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl max-w-3xl w-full text-center">
                <p className="text-xl text-gray-700 leading-relaxed">
                  This game is about animals' life cycle. The cards show different stages of 
                  ladybugs and monarch butterflies. Both go through four stages: egg, larva, 
                  pupa and adult. This transformation is called metamorphosis.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-[500px] text-center">
                <h3 className="text-2xl font-bold mb-4">Monarch Life Cycle</h3>
                <img 
                  src="/reference_MONARCH.png" 
                  alt="Monarch" 
                  className="w-full h-auto mx-auto"
                />
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-[500px] text-center">
                <h3 className="text-2xl font-bold mb-4">Ladybug Life Cycle</h3>
                <img 
                  src="/reference_LADYBUG.png" 
                  alt="Ladybug" 
                  className="w-full h-auto mx-auto"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="h-full flex flex-col md:flex-row items-center justify-center gap-12 p-8">
            <div className="relative w-64 h-64">
              <img src="/character.png" alt="Guide" className="w-full h-full object-contain" />
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-3xl w-full text-center">
              <h2 className="text-3xl font-bold mb-6">Game Rules</h2>
              <div className="space-y-4 text-lg text-gray-700">
                <p>• Each player starts with a shuffled deck</p>
                <p>• Simultaneously flip top cards</p>
                <p>• Higher life stage wins the round</p>
                <p>• Tie? Flip one more card to decide</p>
                <p>• Collect all cards to win</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <h2 className="text-4xl font-bold text-center mb-12">Which card wins?</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-16">
              <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-yellow-400 text-center">
                <img 
                  src="/monarch2.png" 
                  alt="Monarch" 
                  className="w-64 h-96 object-contain mx-auto"
                />
              </div>
              <div className="text-4xl font-bold text-red-600">VS</div>
              <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-blue-400 text-center">
                <img 
                  src="/ladybug4.png" 
                  alt="Ladybug" 
                  className="w-64 h-96 object-contain mx-auto"
                />
              </div>
            </div>
          </div>
        );

      default: 
        return null;
    }
  };

  const startNewGame = async () => {
    const res = await fetch('/api/py/new_game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ common_deck: config })
    });
    const data = await res.json();
    
    setGameState({
      ...data,
      player_a_discard: [],
      player_b_discard: [],
      result: '',
      round_results: []
    });
    setCurrentCards({ a: null, b: null });
    setShowConfig(false);
    setShowFinalResult(false);
  };

  const handlePlayCard = async (player: 'a' | 'b') => {
    if (gameState.game_over || currentCards[player]) return;

    const currentDeck = player === 'a' 
      ? [...gameState.player_a_deck] 
      : [...gameState.player_b_deck];
    
    if (currentDeck.length === 0) return;

    const cardIndex = Math.floor(Math.random() * currentDeck.length);
    const usedCard = currentDeck[cardIndex];
    const newDeck = currentDeck.filter((_, i) => i !== cardIndex);

    setCurrentCards(prev => ({ ...prev, [player]: usedCard }));

    setGameState(prev => player === 'a' ? {
      ...prev,
      player_a_deck: newDeck,
      player_a_sequence: [...prev.player_a_sequence, usedCard]
    } : {
      ...prev,
      player_b_deck: newDeck,
      player_b_sequence: [...prev.player_b_sequence, usedCard]
    });

    setWaitingForComparison(true);
  };

  useEffect(() => {
    if (waitingForComparison && currentCards.a && currentCards.b) {
      const compareCards = async () => {
        const res = await fetch('/api/py/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_a: currentCards.a,
            card_b: currentCards.b
          })
        });
        
        const result = await res.json();
        const cardA = currentCards.a;
        const cardB = currentCards.b;
        
        setGameState(prev => {
          const newState = {
            ...prev,
            player_a_score: result.winner === 'A' ? prev.player_a_score + 1 : prev.player_a_score,
            player_b_score: result.winner === 'B' ? prev.player_b_score + 1 : prev.player_b_score,
            round_results: [...prev.round_results, result],
            result: result.result,
          };

          const isFinalRound = newState.player_a_deck.length === 0 && 
            newState.player_b_deck.length === 0;

          if (isFinalRound) {
            setTimeout(async () => {
              const finalRes = await fetch('/api/py/end_game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newState)
              });
              const finalData = await finalRes.json();
              setShowFinalResult(true);
              setGameState(prev => ({
                ...prev,
                result: finalData.result,
                game_over: true
              }));
            }, 1500);
          }

          return newState;
        });

        setTimeout(() => {
          setCurrentCards({ a: null, b: null });
          setGameState(prev => ({
            ...prev,
            player_a_discard: [...prev.player_a_discard, cardA!],
            player_b_discard: [...prev.player_b_discard, cardB!]
          }));
          setWaitingForComparison(false);
        }, 1500);
      };

      compareCards();
    }
  }, [waitingForComparison, currentCards]);

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
    setShowFinalResult(true);
  };

  const updateConfig = (card: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      [card]: Math.max(0, value)
    }));
  };

  const renderGameResult = () => {
    if (!gameState.result) return null;

    return (
      <div className="mt-4 p-3 bg-white rounded-lg text-center animate-fade-in shadow-md">
        {showFinalResult ? (
          <div className="p-4">
            <div className="text-2xl font-bold text-emerald-600 mb-2">🏆 Final Result 🏆</div>
            <div className="text-xl">{gameState.result}</div>
            <div className="text-3xl mt-3">
              <span className="text-blue-600">{gameState.player_a_score}</span>
              <span className="mx-3">:</span>
              <span className="text-red-600">{gameState.player_b_score}</span>
            </div>
          </div>
        ) : (
          <span className="font-bold text-lg">
            {gameState.game_over ? gameState.result : `Round Result: ${gameState.result}`}
          </span>
        )}
      </div>
    );
  };

  const DiscardPile = ({ cards, isRight, position }: { 
    cards: Card[]; 
    isRight?: boolean;
    position: 'left' | 'right'; 
  }) => (
    <div 
      className={`absolute ${position === 'left' ? 'left-1/4' : 'left-3/4'} top-1/2 transform -translate-y-1/2 z-10`}
      style={{ 
        height: '12rem',
        width: `${CARD_ASPECT_RATIO * 12}rem`,
        perspective: '1000px'
      }}
    >
      {cards.map((card, index) => (
        <div
          key={`${card.image}-${index}`}
          className="absolute top-0 left-0 w-full h-full transition-all duration-300 hover:z-50 hover:scale-105"
          style={{ 
            transform: `translate(${index * 8}px, ${index * 4}px)
                       rotateZ(${(index % 2 === 0 ? -2 : 2)}deg)`,
            zIndex: index
          }}
        >
          <img
            src={`/${card.image}`}
            alt={card.insect}
            height="200px"
            className={`object-cover rounded-lg shadow-lg border-2 border-white ${
              isRight ? 'rotate-180' : ''
            }`}
          />
        </div>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-white">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-black mb-6 mt-4">
        Relational Reasoning Card Game
      </h1>

      {showIntroduction ? (
        <div className="flex-1 w-full flex flex-col items-center">
          <div className="w-full max-w-6xl h-[70vh] min-h-[500px] flex items-center justify-center">
            {renderIntroduction()}
          </div>
          
          <div className="flex gap-4 mt-8 mb-12">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(p => p - 1)}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors text-lg"
              >
                Previous
              </button>
            )}
            {currentStep < INTRODUCTION_STEPS - 1 ? (
              <button 
                onClick={() => setCurrentStep(p => p + 1)}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-lg"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={() => { 
                  setShowIntroduction(false); 
                  setShowConfig(true); 
                }}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-lg"
              >
                Start Configuration
              </button>
            )}
          </div>
        </div>
      ) : showConfig ? (
        <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Card Configuration</h2>
            <button
              onClick={() => setShowIntroduction(true)}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Back to Introduction
            </button>
          </div>
          <div className="space-y-4">
            {Object.keys(DEFAULT_CONFIG).map(card => (
              <div key={card} className="flex items-center justify-between">
                <label className="w-24 flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <img
                      src={`/${card}.png`}
                      alt={card}
                      height="30px"
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
          <div className="w-full p-4 mb-4">
            <div className="flex justify-between gap-4 h-32">
              <div className="relative flex-1" style={{ aspectRatio: REFERENCE_ASPECT_RATIO }}>
                <img 
                  src="/reference_MONARCH.png" 
                  alt="Monarch Reference" 
                  height="100px"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="relative flex-1" style={{ aspectRatio: REFERENCE_ASPECT_RATIO }}>
                <img 
                  src="/reference_LADYBUG.png" 
                  alt="Ladybug Reference" 
                  height="100px"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Player 1 Section */}
          <div className="flex-1 rounded-xl p-4 bg-gray-50 relative">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Player1</h2>
              <div className="flex gap-4">
                <div className="font-semibold">Cards Left: {gameState.player_a_deck.length}</div>
              </div>
            </div>
            
            <DiscardPile 
              cards={gameState.player_a_discard} 
              isRight 
              position="right"
            />

            <div className="flex items-center justify-center gap-8">
              <div 
                className={`relative rounded-lg transition-colors ${
                  gameState.player_a_deck.length > 0 
                    ? 'cursor-pointer hover:bg-gray-100' 
                    : 'bg-gray-100'
                }`}
                style={{ height: '12rem', width: `${CARD_ASPECT_RATIO * 12}rem` }}
                onClick={() => handlePlayCard('a')}
              >
                {gameState.player_a_deck.length > 0 && (
                  <img 
                    src="/back.png" 
                    alt="card back" 
                    height="200px"
                    className={`w-full h-full object-cover rounded-lg opacity-75 rotate-180 ${
                      !currentCards.a ? 'animate-pulse' : ''
                    }`}
                  />
                )}
              </div>
              <div className="relative" style={{ height: '12rem', width: `${CARD_ASPECT_RATIO * 12}rem` }}>
                {currentCards.a && (
                  <div className="relative w-full h-full animate-card-flip">
                    <img
                      src={`/${currentCards.a.image}`}
                      alt={currentCards.a.insect}
                      height="200px"
                      className="w-full h-full object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Center */}
          <div className="flex flex-col items-center gap-4 my-4">
            <div className="text-4xl font-bold text-blue-600">
              {gameState.player_a_score} : {gameState.player_b_score}
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={endGame}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                End Game
              </button>
              <button
                onClick={() => {
                  setShowConfig(true);
                  setCurrentCards({ a: null, b: null });
                  setShowFinalResult(false);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reconfigure
              </button>
            </div>

            {renderGameResult()}
          </div>

          {/* Player 2 Section */}
          <div className="flex-1 rounded-xl p-4 bg-gray-50 relative">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Player2</h2>
              <div className="flex gap-4">
                <div className="font-semibold">Cards Left: {gameState.player_b_deck.length}</div>
              </div>
            </div>

            <DiscardPile 
              cards={gameState.player_b_discard}
              position="left"
            />

            <div className="flex items-center justify-center gap-8">
              <div className="relative" style={{ height: '12rem', width: `${CARD_ASPECT_RATIO * 12}rem` }}>
                {currentCards.b && (
                  <div className="relative w-full h-full animate-card-flip">
                    <img
                      src={`/${currentCards.b.image}`}
                      alt={currentCards.b.insect}
                      height="200px"
                      className="w-full h-full object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>
              <div 
                className={`relative rounded-lg transition-colors ${
                  gameState.player_b_deck.length > 0 
                    ? 'cursor-pointer hover:bg-gray-100' 
                    : 'bg-gray-100'
                }`}
                style={{ height: '12rem', width: `${CARD_ASPECT_RATIO * 12}rem` }}
                onClick={() => handlePlayCard('b')}
              >
                {gameState.player_b_deck.length > 0 && (
                  <img 
                    src="/back.png" 
                    alt="card back" 
                    height="200px"
                    className={`w-full h-full object-cover rounded-lg opacity-75 ${
                      !currentCards.b ? 'animate-pulse' : ''
                    }`}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}