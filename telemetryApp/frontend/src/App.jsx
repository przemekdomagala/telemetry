import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import HistoricData from './components/HistoricData';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/historic" element={<HistoricData />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
