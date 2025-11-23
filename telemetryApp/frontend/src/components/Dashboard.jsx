import BoatVelocityDisplay from './BoatVelocityDisplay';
import WebRTCReceiver from './WebRTCReceiver';
import '../css/Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Dashboard</h2>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <BoatVelocityDisplay />
        </div>

        <div className="dashboard-card">
          <WebRTCReceiver />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
