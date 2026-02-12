import { createContext, useContext, useState, ReactNode } from 'react';

export interface GuessRecord {
  id: string;
  pokemonName: string;
  pokemonId: number;
  imageUrl: string;
  wasCorrect: boolean;
  timestamp: Date;
}

interface GuessHistoryContextType {
  history: GuessRecord[];
  addGuess: (record: Omit<GuessRecord, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  stats: {
    correct: number;
    wrong: number;
    total: number;
    percentage: number;
  };
}

const GuessHistoryContext = createContext<GuessHistoryContextType | undefined>(undefined);

export function GuessHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<GuessRecord[]>([]);

  const addGuess = (record: Omit<GuessRecord, 'id' | 'timestamp'>) => {
    const newRecord: GuessRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setHistory((prev) => [newRecord, ...prev]); // Most recent first
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const stats = {
    correct: history.filter((g) => g.wasCorrect).length,
    wrong: history.filter((g) => !g.wasCorrect).length,
    total: history.length,
    percentage: history.length > 0
      ? Math.round((history.filter((g) => g.wasCorrect).length / history.length) * 100)
      : 0,
  };

  return (
    <GuessHistoryContext.Provider value={{ history, addGuess, clearHistory, stats }}>
      {children}
    </GuessHistoryContext.Provider>
  );
}

export function useGuessHistory() {
  const context = useContext(GuessHistoryContext);
  if (!context) {
    throw new Error('useGuessHistory must be used within a GuessHistoryProvider');
  }
  return context;
}
