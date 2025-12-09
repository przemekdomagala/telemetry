import BoatPositionDisplay from './BoatPositionDisplay';
import WebRTCReceiver from './WebRTCReceiver';
import MapDisplay from './MapDisplay';
import BatteryPlot from './BatteryPlot';
import MissionDescriptionDisplay from './MissionDescriptionDisplay';
import StatusDisplay from './StatusDisplay';
import '../../css/Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Dashboard</h2>

      <div className="dashboard-content">
        <div className="dashboard-card camera-card">
          <WebRTCReceiver />
        </div>

        <div className="dashboard-card map-card">
          <MapDisplay />
        </div>

        <div className="dashboard-card mission-card">
          <MissionDescriptionDisplay />
        </div>

        <div className="dashboard-card battery-card">
          <BatteryPlot />
        </div>
        <div className="dashboard-card position-card">
          <BoatPositionDisplay />
        </div>

        <div className="dashboard-card status-card">
          <StatusDisplay />
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
