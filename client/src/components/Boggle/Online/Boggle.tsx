import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Arrow, { type ArrowDirection, type ArrowProps } from '../../Arrow/Arrow';
import { socket } from '../../../socket/client';
import { SOCKET_EVENTS } from '../../../socket/events';
import type { RoundStartPayload } from '../../../types/payload';
import { canSpell, formatTime, getWordScore } from '../../../utils/game';
import { useWordList } from '../../../context/WordListContext';
import '../index.css';

type GameProps = RoundStartPayload;

const shouldBeInPortrait = /iPhone|iPod|Android/i.test(navigator.userAgent);

function OnlineBoggle({ roomId, round, totalRounds, board, expiresAt }: GameProps) {
  const [word, setWord] = useState('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currScore, setCurrScore] = useState(0);
  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [arrows, setArrows] = useState<ArrowProps[]>([]);
  const [prevIndex, setPrevIndex] = useState(-1);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil((expiresAt - Date.now()) / 1000));
  const [roundOver, setRoundOver] = useState(false);
  const [scoreAnimations, setScoreAnimations] = useState<{ id: number; points: number }[]>([]);
  const [isPortrait, setIsPortrait] = useState(
    window.matchMedia('(orientation: portrait)').matches,
  );

  const validWords = useWordList();

  const letterRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const selectionActiveRef = useRef(false);
  const roundSubmittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ROWS = Math.sqrt(board.length);
  const COLS = ROWS;

  const MIN_LENGTH = ROWS === 5 ? 4 : 3;

  useEffect(() => {
    const handleOrientationChange = (e: MediaQueryListEvent) => {
      setIsPortrait(e.matches);
    };

    const mediaQuery = window.matchMedia('(orientation: portrait)');

    mediaQuery.addEventListener('change', handleOrientationChange);

    return () => {
      mediaQuery.removeEventListener('change', handleOrientationChange);
    };
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

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const midX = (fromRect.left + toRect.right) / 2 + scrollX;
    const midY = (fromRect.top + toRect.bottom) / 2 + scrollY;

    const left = `${midX}px`;
    const top = `${midY}px`;
    let direction: ArrowDirection;

    if (to === from + 1) {
      direction = 'right';
    } else if (to === from - 1) {
      direction = 'left';
    } else if (to === from + COLS) {
      direction = 'down';
    } else if (to === from - COLS) {
      direction = 'up';
    } else if (to === from + COLS + 1) {
      direction = 'bottom-right';
    } else if (to === from + COLS - 1) {
      direction = 'bottom-left';
    } else if (to === from - COLS + 1) {
      direction = 'top-right';
    } else if (to === from - COLS - 1) {
      direction = 'top-left';
    }

    setArrows((prev) => [...prev, { direction, top, left, boardDimension: ROWS }]);
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
      word.length >= MIN_LENGTH &&
      !foundWords.includes(word) &&
      validWords.has(word) &&
      canSpell(board, word)
    );
  };

  const handleCheckWord = () => {
    if (!isValidWord(word)) {
      inputRef.current?.classList.add('invalid');
      setTimeout(() => {
        inputRef.current?.classList.remove('invalid');
      }, 1000);
      return;
    }

    const score = getWordScore(word, ROWS);

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

    if (word.length >= MIN_LENGTH && validWords.has(word) && !foundWords.includes(word)) {
      const score = getWordScore(word, ROWS);

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

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.toLowerCase();
    if (newValue.length === 0 || /^[a-zA-Z]+$/.test(newValue)) {
      setWord(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheckWord();
    }
  };

  if (!isPortrait && shouldBeInPortrait) {
    return (
      <div className="orientation-overlay">
        <p>
          Please rotate your device to portrait mode<span> 📱</span>
        </p>
      </div>
    );
  }

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
                onChange={handleOnChange}
                onKeyDown={handleKeyDown}
                maxLength={25}
                placeholder={scoreAnimations.length > 0 ? 'Nice!' : 'Build a word'}
              />
              {scoreAnimations.map((anim) => (
                <div key={anim.id} className="points-fly">
                  +{anim.points}
                </div>
              ))}
            </div>
          </div>
          <div className="game-timer">{formatTime(secondsLeft)}</div>
        </div>

        <div className="game-grid-container">
          <div
            className={`letter-grid letter-grid-${ROWS}`}
            onPointerLeave={endSelection}
            onTouchMove={handleTouchMove}
          >
            {board.map((letter, index) => (
              <div key={index} className={`dice-container dice-container-${ROWS}`}>
                <span
                  ref={(el) => {
                    letterRefs.current[index] = el;
                  }}
                  className={`letter letter-${ROWS} ${highlighted.includes(index) ? 'active' : ''}`}
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
          <Arrow
            key={index}
            direction={arrow.direction}
            top={arrow.top}
            left={arrow.left}
            boardDimension={ROWS}
          />
        )),
        document.body,
      )}
    </section>
  );
}

export default OnlineBoggle;
