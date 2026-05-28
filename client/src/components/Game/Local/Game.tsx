import LocalBoggle from '../../Boggle/Local/Boggle';
import Header from '../../Header/Header';
import '../index.css';

function LocalGame() {
  return (
    <>
      <Header />
      <main className="app">
        <LocalBoggle />
      </main>
    </>
  );
}

export default LocalGame;
