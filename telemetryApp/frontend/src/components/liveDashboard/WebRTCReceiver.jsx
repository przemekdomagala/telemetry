import { useRef } from 'react';
import useWebRTC from '../../hooks/useWebRTC';

const WebRTCReceiver = () => {
    const rosImageRef = useRef(null);
    const placeholderRef = useRef(null);

    const { status, isReceiving, isConnected, streamStatus } = useWebRTC({
        rosImageRef,
        placeholderRef
    });

    return (
        <div className="container">
            <h4>Stream Receiver</h4>

            <div className="video-container">
                <img 
                    ref={rosImageRef}
                    id="rosImageDisplay"
                    alt="ROS Stream"
                    style={{ display: 'none' }}
                />
                <div ref={placeholderRef} className="placeholder">
                    Waiting for camera stream from client...
                </div>
            </div>

            <div className="stats">
                <div className="stat">
                    <div className="stat-label">Stream Status</div>
                    <div 
                        className="stat-value" 
                        style={{ color: streamStatus === 'LIVE' ? '#4CAF50' : '#f44336' }}
                    >
                        {streamStatus}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebRTCReceiver;