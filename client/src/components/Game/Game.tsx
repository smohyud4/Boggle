import { useEffect, useRef, useState, type JSX } from 'react';
import { createPortal } from 'react-dom';
import Arrow, { type ArrowProps } from '../Arrow/Arrow';
import { socket } from '../../socket/client';
import { SOCKET_EVENTS } from '../../socket/events';
import type { RoundStartPayload } from '../../types/payload';
import './Game.css';

import {
  ArrowLeft,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
} from 'lucide-react';

const arrows = {
  left: <ArrowLeft className="arrow-icon" />,
  up: <ArrowUp className="arrow-icon" />,
  right: <ArrowRight className="arrow-icon" />,
  down: <ArrowDown className="arrow-icon" />,
  'top-right': <ArrowUpRight className="arrow-icon" />,
  'top-left': <ArrowUpLeft className="arrow-icon" />,
  'bottom-right': <ArrowDownRight className="arrow-icon" />,
  'bottom-left': <ArrowDownLeft className="arrow-icon" />,
};

function getArrowString(direction: keyof typeof arrows): JSX.Element {
  return arrows[direction];
}

function canSpell(board: string[], word: string) {
  const grid: string[][] = [];
  const n = Math.sqrt(board.length);

  for (let i = 0; i < n; i++) {
    grid.push(board.slice(i * n, (i + 1) * n));
  }

  function dfs(r: number, c: number, index: number, visited = new Set<number>()): boolean {
    if (r < 0 || r >= n || c < 0 || c >= n) return false;

    const square = r * n + c;
    const cellContent = grid[r][c];
    const cellLength = cellContent.length;

    if (visited.has(square)) return false;
    if (index >= word.length) return false;

    if (cellContent !== word.slice(index, index + cellLength)) return false;

    if (index + cellLength === word.length) return true;

    visited.add(square);

    const nextIndex = index + cellLength;

    if (dfs(r + 1, c, nextIndex, visited)) return true;
    if (dfs(r - 1, c, nextIndex, visited)) return true;
    if (dfs(r, c - 1, nextIndex, visited)) return true;
    if (dfs(r, c + 1, nextIndex, visited)) return true;
    if (dfs(r + 1, c + 1, nextIndex, visited)) return true;
    if (dfs(r - 1, c - 1, nextIndex, visited)) return true;
    if (dfs(r + 1, c - 1, nextIndex, visited)) return true;
    if (dfs(r - 1, c + 1, nextIndex, visited)) return true;

    visited.delete(square);
    return false;
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (dfs(i, j, 0)) return true;
    }
  }

  return false;
}

type GameProps = RoundStartPayload;

function Game({ roomId, round, totalRounds, board, scoringParams, expiresAt }: GameProps) {
  const [word, setWord] = useState('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currScore, setCurrScore] = useState(0);
  const [validWords, setValidWords] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [arrows, setArrows] = useState<ArrowProps[]>([]);
  const [prevIndex, setPrevIndex] = useState(-1);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil((expiresAt - Date.now()) / 1000));
  const [roundOver, setRoundOver] = useState(false);
  const [scoreAnimations, setScoreAnimations] = useState<{ id: number; points: number }[]>([]);

  const letterRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const selectionActiveRef = useRef(false);
  const roundSubmittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ROWS = Math.sqrt(board.length);
  const COLS = ROWS;

  useEffect(() => {
    const fetchValidWords = async () => {
      try {
        const response = await fetch('word-list.txt');
        const data = await response.text();
        setValidWords(new Set(data.split('\n').map((entry) => entry.trim())));
      } catch (error) {
        console.error('Error fetching valid words:', error);
      }
    };

    fetchValidWords();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const remainingSeconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remainingSeconds);

      if (remainingSeconds === 0 && !roundSubmittedRef.current) {
        setRoundOver(true);
        roundSubmittedRef.current = true;
        window.clearInterval(timer);
      }
    }, 250);

    const resetRound = () => {
      setWord('');
      setFoundWords([]);
      setCurrScore(0);
      setHighlighted([]);
      setPrevIndex(-1);
      setRoundOver(false);
      setArrows([]);
      roundSubmittedRef.current = false;
      selectionActiveRef.current = false;
    };

    resetRound();
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const triggerScoreAnimation = (points: number) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setScoreAnimations((prev) => [...prev, { id, points }]);
    window.setTimeout(() => {
      setScoreAnimations((prev) => prev.filter((a) => a.id !== id));
    }, 1000);
  };

  const getWordScore = (candidate: string) => {
    if (Object.keys(scoringParams).length === 0) return 1;
    if (candidate.length >= 8) return 11;
    return scoringParams[candidate.length] || 0;
  };

  const validMove = (index: number) => {
    if (!selectionActiveRef.current || highlighted.includes(index)) return false;

    const row = Math.floor(index / ROWS);
    const prevRow = Math.floor(prevIndex / ROWS);
    const col = index % COLS;
    const prevCol = prevIndex % COLS;

    if (row === prevRow && Math.abs(index - prevIndex) === 1) return true;
    if (col === prevCol && Math.abs(index - prevIndex) === COLS) return true;

    return Math.abs(row - prevRow) === 1 && Math.abs(col - prevCol) === 1;
  };

  const drawArrow = (to: number, from: number) => {
    const fromElement = letterRefs.current[from];
    const toElement = letterRefs.current[to];

    if (!fromElement || !toElement) return;

    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const midX = (fromRect.left + toRect.right) / 2;
    const midY = (fromRect.top + toRect.bottom) / 2;

    const left = `${midX}px`;
    const top = `${midY}px`;
    let direction: JSX.Element;

    if (to === from + 1) {
      direction = getArrowString('right');
    } else if (to === from - 1) {
      direction = getArrowString('left');
    } else if (to === from + COLS) {
      direction = getArrowString('down');
    } else if (to === from - COLS) {
      direction = getArrowString('up');
    } else if (to === from + COLS + 1) {
      direction = getArrowString('bottom-right');
    } else if (to === from + COLS - 1) {
      direction = getArrowString('bottom-left');
    } else if (to === from - COLS + 1) {
      direction = getArrowString('top-right');
    } else if (to === from - COLS - 1) {
      direction = getArrowString('top-left');
    }

    setArrows((prev) => [...prev, { direction, top, left }]);
  };

  const startSelection = (letter: string, index: number) => {
    selectionActiveRef.current = true;
    setWord(letter);
    setHighlighted([index]);
    setPrevIndex(index);
  };

  const continueSelection = (letter: string, index: number) => {
    if (!validMove(index)) return;

    setWord((prev) => prev + letter);
    drawArrow(index, prevIndex);
    setHighlighted((prev) => [...prev, index]);
    setPrevIndex(index);
  };

  const isValidWord = (word: string) => {
    return !foundWords.includes(word) && validWords.has(word) && canSpell(board, word);
  };

  const handleCheckWord = () => {
    if (!isValidWord(word)) {
      inputRef.current?.classList.add('invalid');
      setTimeout(() => {
        inputRef.current?.classList.remove('invalid');
      }, 1000);
      return;
    }

    const score = getWordScore(word);

    socket.emit(SOCKET_EVENTS.SUBMIT_WORDS, {
      roomId,
      words: [word],
      timeStamp: Date.now(),
    });

    setFoundWords((prev) => [word, ...prev]);
    setCurrScore((prev) => prev + score);
    triggerScoreAnimation(score);
    setWord('');
    setHighlighted([]);
    setPrevIndex(-1);
    setArrows([]);
  };

  const endSelection = () => {
    if (!selectionActiveRef.current) return;

    selectionActiveRef.current = false;

    if (validWords.has(word) && !foundWords.includes(word)) {
      const score = getWordScore(word);

      socket.emit(SOCKET_EVENTS.SUBMIT_WORDS, {
        roomId,
        words: [word],
        timeStamp: Date.now(),
      });

      setFoundWords((prev) => [word, ...prev]);
      setCurrScore((prev) => prev + score);
      triggerScoreAnimation(score);
    }

    setWord('');
    setHighlighted([]);
    setPrevIndex(-1);
    setArrows([]);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!selectionActiveRef.current) return;

    const touch = event.touches[0];

    if (!touch) return;

    const x = touch.clientX;
    const y = touch.clientY;

    for (let index = 0; index < ROWS * COLS; index++) {
      const el = letterRefs.current[index];

      if (!el) continue;

      const rect = el.getBoundingClientRect();

      const containsPoint = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

      if (containsPoint) {
        continueSelection(board[index], index);
        break;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheckWord();
    }
  };

  return (
    <section className="game-shell">
      <div className="game-board-panel">
        <div className="game-status-row">
          <div>
            <p className="game-eyebrow">
              Round {round} of {totalRounds}
            </p>
            <div className="word-entry-row">
              <input
                ref={inputRef}
                className="word-input"
                value={word}
                onChange={(event) => setWord(event.target.value.toLowerCase())}
                onKeyDown={handleKeyDown}
                placeholder={scoreAnimations.length > 0 ? 'Nice!' : 'Build a word'}
              />
              {scoreAnimations.map((anim) => (
                <div key={anim.id} className="points-fly">
                  +{anim.points}
                </div>
              ))}
            </div>
          </div>
          <div className="game-timer">{secondsLeft}s</div>
        </div>

        <div className="game-grid-container">
          <div className="letter-grid" onPointerLeave={endSelection} onTouchMove={handleTouchMove}>
            {board.map((letter, index) => (
              <div key={index}>
                <span
                  ref={(el) => {
                    letterRefs.current[index] = el;
                  }}
                  className={`letter ${highlighted.includes(index) ? 'active' : ''}`}
                  onPointerDown={() => startSelection(letter, index)}
                  onPointerEnter={() => continueSelection(letter, index)}
                  onPointerUp={endSelection}
                >
                  {letter}
                </span>
              </div>
            ))}
          </div>
          <div className="game-sidebar">
            <div className="word-container">
              <h3>Words</h3>
              {foundWords.length > 0 ? (
                <ul>
                  {foundWords.map((foundWord) => (
                    <li key={foundWord}>{foundWord}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted-text">No words found yet.</p>
              )}
            </div>
            <div className="score-container">
              <h3>Score</h3>
              <p className="score-value">{currScore}</p>
            </div>
          </div>
        </div>
      </div>

      {roundOver && (
        <div className="backdrop">
          <p>Waiting on Server...</p>
        </div>
      )}

      {createPortal(
        arrows.map((arrow, index) => (
          <Arrow key={index} direction={arrow.direction} top={arrow.top} left={arrow.left} />
        )),
        document.body,
      )}
    </section>
  );
}

export default Game;
