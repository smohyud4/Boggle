import { useLocation, Link } from 'react-router';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const isLocal = location.pathname === '/';
  const isOnline = location.pathname === '/online';

  return (
    <header className="header">
      <nav className="header-nav">
        <Link to="/" className={`header-button ${isLocal ? 'active' : ''}`}>
          Local
        </Link>
        <Link to="/online" className={`header-button ${isOnline ? 'active' : ''}`}>
          Online
        </Link>
      </nav>
    </header>
  );
}
