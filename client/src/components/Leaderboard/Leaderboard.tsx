import './Leaderboard.css';

type LeaderboardEntry = {
  playerId: string;
  name: string;
  totalWords: number;
  totalScore: number;
};

type LeaderBoardProps = {
  entries: LeaderboardEntry[];
  onRefresh: () => void;
  onStartNewGame: () => void;
};

export default function LeaderBoard({ entries, onRefresh, onStartNewGame }: LeaderBoardProps) {
  const getLeaderboardClass = (index: number) => {
    if (index === 0) return ' --first';
    if (index === 1) return ' --second';
    if (index === 2) return ' --third';
    return '';
  };

  return (
    <section className="leaderboard">
      <header className="leaderboard__header">
        <div>
          <p className="result-modal__eyebrow">Final ranking</p>
          <h3>LeaderBoard</h3>
        </div>
      </header>

      <ol className="leaderboard__list">
        <li className="table__header">
          <div className="left-data">
            <span className="leaderboard__rank"></span>
            <span className="leaderboard__name">Player</span>
          </div>
          <div className="right-data">
            <span className="leaderboard__score">Words</span>
            <span className="leaderboard__score">Score</span>
          </div>
        </li>
        {entries.map((entry, index) => (
          <li key={entry.playerId} className="leaderboard__row">
            <div className="left-data">
              <span className={`leaderboard__rank${getLeaderboardClass(index)}`}>{index + 1}</span>
              <span className="leaderboard__name">{entry.name}</span>
            </div>
            <div className="right-data">
              <span className="leaderboard__score">{entry.totalWords}</span>
              <span className="leaderboard__score">{entry.totalScore}</span>
            </div>
          </li>
        ))}
      </ol>

      <footer className="leaderboard__footer">
        <button type="button" className="new-game" onClick={onStartNewGame}>
          New Game
        </button>
        <button type="button" className="exit-lobby" onClick={onRefresh}>
          Exit Lobby
        </button>
      </footer>
    </section>
  );
}
