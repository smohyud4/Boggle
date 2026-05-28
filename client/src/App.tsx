import { BrowserRouter, Routes, Route } from 'react-router';
import LocalGame from './components/Game/Local/Game';
import OnlineGame from './components/Game/Online/Game';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LocalGame />} />
        <Route path="/online" element={<OnlineGame />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
