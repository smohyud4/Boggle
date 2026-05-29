import { useState } from 'react';
import LocalBoggle from '../../Boggle/Local/Boggle';
import Header from '../../Header/Header';
import '../index.css';

function LocalGame() {
  const [boardDimension, setBoardDimension] = useState(4);

  return (
    <>
      <Header />
      <main className="app">
        <LocalBoggle boardDimension={boardDimension} />
        <button onClick={() => setBoardDimension(4)}>4x4</button>
        <button onClick={() => setBoardDimension(5)}>5x5</button>
      </main>
    </>
  );
}

export default LocalGame;
