import { useState } from 'react';
import LocalBoggle from '../../Boggle/Local/Boggle';
import Header from '../../Header/Header';
import '../index.css';

function LocalGame() {
  const [boardDimension, setBoardDimension] = useState(5);

  return (
    <>
      <Header />
      <main className="app">
        <LocalBoggle boardDimension={boardDimension} />
      </main>
    </>
  );
}

export default LocalGame;
