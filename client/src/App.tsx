import { BrowserRouter, Routes, Route } from 'react-router';
import LocalGame from './components/Game/Local/Game';
import Loader from './components/Loader/Loader';
import { lazy, Suspense } from 'react';

const OnlineGame = lazy(() => import('./components/Game/Online/Game'));

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <main className="app">
            <Loader />
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<LocalGame />} />
          <Route path="/online" element={<OnlineGame />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
