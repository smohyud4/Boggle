import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Arrow, { type ArrowProps } from "../Arrow/Arrow";
import { socket } from "../../socket/client";
import { SOCKET_EVENTS } from "../../socket/events";
import type { RoundStartPayload } from "../../types/payload";
import "./Game.css";

function getArrowString(direction: string) {
  switch (direction) {
    case "left":
      return "\u2190";
    case "up":
      return "\u2191";
    case "right":
      return "\u2192";
    case "down":
      return "\u2193";
    case "top-right":
      return "\u2197";
    case "top-left":
      return "\u2196";
    case "bottom-right":
      return "\u2198";
    case "bottom-left":
      return "\u2199";
    default:
      return "";
  }
}

function canSpell(board: string[], word: string) {
  const grid: string[][] = [];
  const n = Math.sqrt(board.length);

  for (let i = 0; i < n; i++) {
    grid.push(board.slice(i * n, (i + 1) * n));
  }

  function dfs(
    r: number,
    c: number,
    index: number,
    visited = new Set<number>(),
  ): boolean {
    if (r < 0 || r >= n || c < 0 || c >= n) return false;

    const square = r * n + c;

    if (visited.has(square)) return false;
    if (index >= word.length) return false;
    if (grid[r][c] !== word[index]) return false;
    if (index == word.length - 1) return true;

    visited.add(square);

    if (dfs(r + 1, c, index + 1, visited)) return true;
    if (dfs(r - 1, c, index + 1, visited)) return true;
    if (dfs(r, c - 1, index + 1, visited)) return true;
    if (dfs(r, c + 1, index + 1, visited)) return true;
    if (dfs(r + 1, c + 1, index + 1, visited)) return true;
    if (dfs(r - 1, c - 1, index + 1, visited)) return true;
    if (dfs(r + 1, c - 1, index + 1, visited)) return true;
    if (dfs(r - 1, c + 1, index + 1, visited)) return true;

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

function Game({
  roomId,
  round,
  totalRounds,
  board,
  scoringParams,
  expiresAt,
}: GameProps) {
  const [word, setWord] = useState("");
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currScore, setCurrScore] = useState(0);
  const [validWords, setValidWords] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [arrows, setArrows] = useState<ArrowProps[]>([]);
  const [prevIndex, setPrevIndex] = useState(-1);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
  );

  const letterRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const selectionActiveRef = useRef(false);
  const roundSubmittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ROWS = Math.sqrt(board.length);
  const COLS = ROWS;

  useEffect(() => {
    const fetchValidWords = async () => {
      try {
        const response = await fetch("word-list.txt");
        const data = await response.text();
        setValidWords(new Set(data.split("\n").map((entry) => entry.trim())));
      } catch (error) {
        console.error("Error fetching valid words:", error);
      }
    };

    fetchValidWords();
  }, []);

  useEffect(() => {
    const resetRound = () => {
      setWord("");
      setFoundWords([]);
      setCurrScore(0);
      setHighlighted([]);
      setPrevIndex(-1);
      setArrows([]);
      roundSubmittedRef.current = false;
      selectionActiveRef.current = false;
    };

    resetRound();
  }, [round]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const remainingSeconds = Math.max(
        0,
        Math.ceil((expiresAt - Date.now()) / 1000),
      );
      setSecondsLeft(remainingSeconds);

      if (remainingSeconds === 0 && !roundSubmittedRef.current) {
        roundSubmittedRef.current = true;
        socket.emit(SOCKET_EVENTS.SUBMIT_WORDS, {
          roomId,
          words: foundWords,
        });

        window.clearInterval(timer);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [expiresAt, foundWords, roomId]);

  const getWordScore = (candidate: string) => {
    if (Object.keys(scoringParams).length === 0) return 1;
    if (candidate.length >= 8) return 11;
    return scoringParams[candidate.length] || 0;
  };

  const validMove = (index: number) => {
    if (!selectionActiveRef.current || highlighted.includes(index))
      return false;

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

    const midX = (fromRect.left + (toRect.left + toRect.width)) / 2;
    const midY = (fromRect.top + fromRect.height + toRect.top) / 2;

    const left = `${midX}px`;
    const top = `${midY}px`;
    let direction = "";

    if (to === from + 1) {
      direction = getArrowString("right");
    } else if (to === from - 1) {
      direction = getArrowString("left");
    } else if (to === from + COLS) {
      direction = getArrowString("down");
    } else if (to === from - COLS) {
      direction = getArrowString("up");
    } else if (to === from + COLS + 1) {
      direction = getArrowString("bottom-right");
    } else if (to === from + COLS - 1) {
      direction = getArrowString("bottom-left");
    } else if (to === from - COLS + 1) {
      direction = getArrowString("top-right");
    } else if (to === from - COLS - 1) {
      direction = getArrowString("top-left");
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
    return (
      !foundWords.includes(word) &&
      validWords.has(word) &&
      canSpell(board, word)
    );
  };

  const handleCheckWord = () => {
    if (!isValidWord(word)) {
      inputRef.current?.classList.add("invalid");
      setTimeout(() => {
        inputRef.current?.classList.remove("invalid");
      }, 1000);
      return;
    }

    const score = getWordScore(word);

    setFoundWords((prev) => [...prev, word]);
    setCurrScore((prev) => prev + score);
    setWord("");
    setHighlighted([]);
    setPrevIndex(-1);
    setArrows([]);
  };

  const endSelection = () => {
    if (!selectionActiveRef.current) return;

    selectionActiveRef.current = false;

    if (word && validWords.has(word) && !foundWords.includes(word)) {
      const score = getWordScore(word);
      setFoundWords((prev) => [...prev, word]);
      setCurrScore((prev) => prev + score);
    }

    setWord("");
    setHighlighted([]);
    setPrevIndex(-1);
    setArrows([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
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
                placeholder="Build a word"
              />
            </div>
          </div>
          <div className="game-timer">{secondsLeft}s</div>
        </div>

        <div className="game-grid-container">
          <div className="letter-grid" onPointerLeave={endSelection}>
            {board.map((letter, index) => (
              <span
                key={index}
                ref={(el) => {
                  letterRefs.current[index] = el;
                }}
                className={`letter ${highlighted.includes(index) ? "active" : ""}`}
                onPointerDown={() => startSelection(letter, index)}
                onPointerEnter={() => continueSelection(letter, index)}
                onPointerUp={endSelection}
              >
                {letter}
              </span>
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
        <button
          className="check-button"
          type="button"
          onClick={handleCheckWord}
        >
          Check
        </button>
      </div>

      {createPortal(
        arrows.map((arrow, index) => (
          <Arrow
            key={index}
            direction={arrow.direction}
            top={arrow.top}
            left={arrow.left}
          />
        )),
        document.body,
      )}
    </section>
  );
}

export default Game;
