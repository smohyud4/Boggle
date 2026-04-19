/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Arrow, { type ArrowProps } from "./Arrow";
import type { RoundStartPayload } from "../types/payload";

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

type GameProps = RoundStartPayload;

function Game({ roundNumber, totalRounds, board, scoringParams }: GameProps) {
  const [currBoard, setCurrBoard] = useState<string[]>(board);
  const [word, setWord] = useState("");
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currScore, setCurrScore] = useState(0);
  const [validWords, setValidWords] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [arrows, setArrows] = useState<ArrowProps[]>([]);
  const [prevIndex, setPrevIndex] = useState(-1);
  const [active, setActive] = useState(false);

  const letterRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  const ROWS = Math.sqrt(currBoard.length);
  const COLS = ROWS;

  useEffect(() => {
    const fetchValidWords = async () => {
      try {
        const response = await fetch(`word-list.txt`);
        const data = await response.text();
        setValidWords(new Set(data.split("\n").map((word) => word.trim())));
      } catch (error) {
        console.error("Error fetching valid words:", error);
      }
    };

    fetchValidWords();
  }, []);

  function getWordScore(word: string) {
    if (Object.keys(scoringParams).length === 0) return 1;
    if (word.length >= 8) return 11;
    return scoringParams[word.length] || 0;
  }

  const rotateBoard = (clockWise: boolean) => {
    console.log(clockWise);
  };

  const validMove = (index: number) => {
    if (!active || highlighted.includes(index)) return false;

    const row = Math.floor(index / ROWS),
      prevRow = Math.floor(prevIndex / ROWS);
    const col = index % COLS,
      prevCol = prevIndex % COLS;

    if (row === prevRow && Math.abs(index - prevIndex) === 1) return true;
    if (col === prevCol && Math.abs(index - prevIndex) === COLS) return true;

    // Diag
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

    const left = midX + "px";
    const top = midY + "px";
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
    setWord(letter);
    setHighlighted([index]);
    setActive(true);
    setPrevIndex(index);
  };

  const continueSelection = (letter: string, index: number) => {
    if (!validMove(index)) return;

    setWord((prev) => prev + letter);
    drawArrow(index, prevIndex);
    setHighlighted((prev) => [...prev, index]);
    setPrevIndex(index);
  };

  const endSelection = () => {
    if (validWords.has(word)) {
      setFoundWords((prev) => [...prev, word]);
      setCurrScore((prev) => (prev += getWordScore(word)));
    }

    setWord("");
    setActive(false);
    setHighlighted([]);
    setPrevIndex(-1);
    setArrows([]);
  };

  return (
    <div>
      <h2>{word}</h2>
      <div className="letter-grid" onPointerLeave={endSelection}>
        {currBoard.map((letter, index) => (
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
      <button onClick={() => rotateBoard(true)}>Rotate Clockwise</button>
      <button onClick={() => rotateBoard(false)}>
        Rotate CounterClockwise
      </button>
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
    </div>
  );
}

export default Game;
