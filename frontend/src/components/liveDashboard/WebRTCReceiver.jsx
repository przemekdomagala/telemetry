import { useRef } from 'react';
import useWebRTC from '../../hooks/useWebRTC';

const WebRTCReceiver = () => {
    const rosImageRef = useRef(null);
    const placeholderRef = useRef(null);

    useWebRTC({
        rosImageRef,
        placeholderRef
    });

    return (
        <div className="container">

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
        </div>
    );
};

export default WebRTCReceiver;