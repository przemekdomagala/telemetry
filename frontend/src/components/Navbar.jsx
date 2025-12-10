import { Link } from 'react-router-dom';
import '../App.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Autonomous Boat Telemetry</h1>
      </div>
      <ul className="nav-links">
        <li>
          <Link to="/">Dashboard</Link>
        </li>
        <li>
          <Link to="/historic">Historic Data</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;