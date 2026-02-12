import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// Types
export interface PokemonData {
  id: number;
  name: string;
  imageUrl: string;
}

export interface PlayerGuess {
  guess: string;
  correct: boolean;
  timestamp: Timestamp;
}

export interface RoomData {
  hostId: string;
  guestId: string | null;
  status: 'waiting' | 'ready' | 'countdown' | 'playing' | 'round_end' | 'finished';
  currentRound: number;
  totalRounds: number;
  currentPokemon: PokemonData | null;
  scores: { host: number; guest: number };
  roundWinner: 'host' | 'guest' | 'none' | null;
  gameWinner: 'host' | 'guest' | null;
  hostGuess: PlayerGuess | null;
  guestGuess: PlayerGuess | null;
  countdownStartAt: Timestamp | null;
  createdAt: Timestamp;
}

export type PlayerRole = 'host' | 'guest' | null;
export type BattleState = 'idle' | 'creating' | 'waiting' | 'joining' | 'ready' | 'countdown' | 'playing' | 'round_end' | 'finished';

interface BattleContextType {
  // State
  roomCode: string | null;
  room: RoomData | null;
  playerRole: PlayerRole;
  battleState: BattleState;
  playerId: string;
  error: string | null;
  hasGuessed: boolean;

  // Actions
  createRoom: () => Promise<void>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  startGame: () => Promise<void>;
  submitGuess: (guess: string) => Promise<boolean>;
  nextRound: () => Promise<void>;
  playAgain: () => Promise<void>;
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

// Generate a unique player ID
function generatePlayerId(): string {
  return 'player_' + Math.random().toString(36).substring(2, 15);
}

// Generate a 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0/O, 1/I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Fetch a random Pokemon
async function fetchRandomPokemon(): Promise<PokemonData> {
  const randomId = Math.floor(Math.random() * 151) + 1;
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    imageUrl: data.sprites.other['official-artwork'].front_default,
  };
}

export function BattleProvider({ children }: { children: ReactNode }) {
  const [playerId] = useState(() => generatePlayerId());
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [playerRole, setPlayerRole] = useState<PlayerRole>(null);
  const [battleState, setBattleState] = useState<BattleState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Listen to room changes
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = doc(db, 'rooms', roomCode);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as RoomData;
        setRoom(data);

        // Update battle state based on room status
        if (data.status === 'waiting') {
          setBattleState('waiting');
        } else if (data.status === 'ready') {
          setBattleState('ready');
        } else if (data.status === 'countdown') {
          setBattleState('countdown');
        } else if (data.status === 'playing') {
          setBattleState('playing');
        } else if (data.status === 'round_end') {
          setBattleState('round_end');
        } else if (data.status === 'finished') {
          setBattleState('finished');
        }
      } else {
        // Room was deleted
        setRoom(null);
        setRoomCode(null);
        setPlayerRole(null);
        setBattleState('idle');
      }
    }, (err) => {
      console.error('Room listener error:', err);
      setError('Connection lost. Please try again.');
    });

    return () => unsubscribe();
  }, [roomCode]);

  const createRoom = useCallback(async () => {
    setError(null);
    setBattleState('creating');

    try {
      // Generate unique room code
      let code = generateRoomCode();
      let attempts = 0;
      while (attempts < 10) {
        const roomRef = doc(db, 'rooms', code);
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) break;
        code = generateRoomCode();
        attempts++;
      }

      const roomData: RoomData = {
        hostId: playerId,
        guestId: null,
        status: 'waiting',
        currentRound: 0,
        totalRounds: 5,
        currentPokemon: null,
        scores: { host: 0, guest: 0 },
        roundWinner: null,
        gameWinner: null,
        hostGuess: null,
        guestGuess: null,
        countdownStartAt: null,
        createdAt: serverTimestamp() as Timestamp,
      };

      await setDoc(doc(db, 'rooms', code), roomData);

      setRoomCode(code);
      setPlayerRole('host');
      setBattleState('waiting');
    } catch (err) {
      console.error('Create room error:', err);
      setError('Failed to create room. Please try again.');
      setBattleState('idle');
    }
  }, [playerId]);

  const joinRoom = useCallback(async (code: string): Promise<boolean> => {
    setError(null);
    setBattleState('joining');

    try {
      const roomRef = doc(db, 'rooms', code.toUpperCase());
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setError('Room not found. Check the code and try again.');
        setBattleState('idle');
        return false;
      }

      const roomData = roomSnap.data() as RoomData;

      if (roomData.guestId) {
        setError('Room is full. Try a different code.');
        setBattleState('idle');
        return false;
      }

      if (roomData.status !== 'waiting') {
        setError('Game already in progress.');
        setBattleState('idle');
        return false;
      }

      // Join the room
      await updateDoc(roomRef, {
        guestId: playerId,
        status: 'ready',
      });

      setRoomCode(code.toUpperCase());
      setPlayerRole('guest');
      setBattleState('ready');
      return true;
    } catch (err) {
      console.error('Join room error:', err);
      setError('Failed to join room. Please try again.');
      setBattleState('idle');
      return false;
    }
  }, [playerId]);

  const leaveRoom = useCallback(async () => {
    if (!roomCode) return;

    try {
      const roomRef = doc(db, 'rooms', roomCode);

      if (playerRole === 'host') {
        // Host leaving deletes the room
        await deleteDoc(roomRef);
      } else if (playerRole === 'guest') {
        // Guest leaving resets to waiting
        await updateDoc(roomRef, {
          guestId: null,
          status: 'waiting',
        });
      }
    } catch (err) {
      console.error('Leave room error:', err);
    }

    setRoomCode(null);
    setRoom(null);
    setPlayerRole(null);
    setBattleState('idle');
    setError(null);
  }, [roomCode, playerRole]);

  const startGame = useCallback(async () => {
    if (!roomCode || playerRole !== 'host') return;

    try {
      const pokemon = await fetchRandomPokemon();

      await updateDoc(doc(db, 'rooms', roomCode), {
        status: 'countdown',
        currentRound: 1,
        currentPokemon: pokemon,
        roundWinner: null,
        hostGuess: null,
        guestGuess: null,
        countdownStartAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Start game error:', err);
      setError('Failed to start game. Please try again.');
    }
  }, [roomCode, playerRole]);

  const submitGuess = useCallback(async (guess: string): Promise<boolean> => {
    if (!roomCode || !room || !playerRole || room.status !== 'playing') return false;
    if (!room.currentPokemon) return false;

    // Check if player already guessed this round
    const myGuess = playerRole === 'host' ? room.hostGuess : room.guestGuess;
    if (myGuess) return false; // Already guessed

    const normalizedGuess = guess.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const normalizedAnswer = room.currentPokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isCorrect = normalizedGuess === normalizedAnswer;

    const guessData: PlayerGuess = {
      guess: normalizedGuess,
      correct: isCorrect,
      timestamp: serverTimestamp() as Timestamp,
    };

    try {
      const guessField = playerRole === 'host' ? 'hostGuess' : 'guestGuess';
      const otherGuess = playerRole === 'host' ? room.guestGuess : room.hostGuess;

      if (isCorrect) {
        // Correct guess - this player wins the round!
        const newScores = { ...room.scores };
        newScores[playerRole]++;

        const isGameOver = room.currentRound >= 5 || newScores[playerRole] >= 3;

        await updateDoc(doc(db, 'rooms', roomCode), {
          [guessField]: guessData,
          roundWinner: playerRole,
          scores: newScores,
          status: isGameOver ? 'finished' : 'round_end',
          ...(isGameOver && {
            gameWinner: newScores.host > newScores.guest ? 'host' : 'guest',
          }),
        });
      } else {
        // Wrong guess - check if other player already guessed
        if (otherGuess) {
          // Both have guessed now
          if (otherGuess.correct) {
            // Other player was correct, they already won - just record our guess
            await updateDoc(doc(db, 'rooms', roomCode), {
              [guessField]: guessData,
            });
          } else {
            // Both guessed wrong - round ends with no winner
            const isGameOver = room.currentRound >= 5;

            await updateDoc(doc(db, 'rooms', roomCode), {
              [guessField]: guessData,
              roundWinner: 'none',
              status: isGameOver ? 'finished' : 'round_end',
              ...(isGameOver && {
                gameWinner: room.scores.host > room.scores.guest ? 'host' :
                            room.scores.guest > room.scores.host ? 'guest' : null,
              }),
            });
          }
        } else {
          // Other player hasn't guessed yet - just record our wrong guess
          await updateDoc(doc(db, 'rooms', roomCode), {
            [guessField]: guessData,
          });
        }
      }
    } catch (err) {
      console.error('Submit guess error:', err);
    }

    return isCorrect;
  }, [roomCode, room, playerRole]);

  const nextRound = useCallback(async () => {
    if (!roomCode || playerRole !== 'host' || !room) return;

    try {
      const pokemon = await fetchRandomPokemon();

      await updateDoc(doc(db, 'rooms', roomCode), {
        status: 'countdown',
        currentRound: room.currentRound + 1,
        currentPokemon: pokemon,
        roundWinner: null,
        hostGuess: null,
        guestGuess: null,
        countdownStartAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Next round error:', err);
    }
  }, [roomCode, playerRole, room]);

  const playAgain = useCallback(async () => {
    if (!roomCode || playerRole !== 'host') return;

    try {
      const pokemon = await fetchRandomPokemon();

      await updateDoc(doc(db, 'rooms', roomCode), {
        status: 'countdown',
        currentRound: 1,
        currentPokemon: pokemon,
        scores: { host: 0, guest: 0 },
        roundWinner: null,
        gameWinner: null,
        hostGuess: null,
        guestGuess: null,
        countdownStartAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Play again error:', err);
    }
  }, [roomCode, playerRole]);

  // Check if current player has already guessed this round
  const hasGuessed = room
    ? playerRole === 'host'
      ? room.hostGuess !== null
      : room.guestGuess !== null
    : false;

  return (
    <BattleContext.Provider
      value={{
        roomCode,
        room,
        playerRole,
        battleState,
        playerId,
        error,
        hasGuessed,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        submitGuess,
        nextRound,
        playAgain,
      }}
    >
      {children}
    </BattleContext.Provider>
  );
}

export function useBattle() {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error('useBattle must be used within a BattleProvider');
  }
  return context;
}
