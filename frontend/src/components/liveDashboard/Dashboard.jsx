import BoatPositionDisplay from './BoatPositionDisplay';
import WebRTCReceiver from './WebRTCReceiver';
import MapDisplay from './MapDisplay';
import '../../css/Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Dashboard</h2>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <BoatPositionDisplay />
        </div>

        <div className="dashboard-card">
          <WebRTCReceiver />
        </div>

        <div className="dashboard-card">
          <MapDisplay />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
