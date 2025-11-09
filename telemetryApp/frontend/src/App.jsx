import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import BoatVelocityDisplay from './components/BoatVelocityDisplay'

function App() {
  return (
    <div className="App" style={{ textAlign: 'center', paddingTop: '50px' }}>
      <h1>Autonomous Boat Telemetry Dashboard (POC)</h1>
      <BoatVelocityDisplay />
    </div>
  );
}

export default App
