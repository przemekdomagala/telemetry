import { useState, useEffect, useRef, useCallback } from 'react';
import useWebSocket from './useWebSocket';

const useWebRTC = ({ remoteVideoRef, rosImageRef, placeholderRef }) => {
  const [status, setStatus] = useState({ message: 'Connecting...', type: 'waiting' });
  const [isReceiving, setIsReceiving] = useState(false);
  const [streamStatus, setStreamStatus] = useState('OFFLINE');
  
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const sendMessageRef = useRef(null);

  const handleWebRTCImage = useCallback((data) => {
    try {
      const imageData = JSON.parse(data);
      
      if (imageData.base64 && rosImageRef.current) {
        if (remoteVideoRef && remoteVideoRef.current) {
          remoteVideoRef.current.style.display = 'none';
        }
        rosImageRef.current.src = imageData.base64;
        rosImageRef.current.style.display = 'block';
        if (placeholderRef.current) {
          placeholderRef.current.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error handling WebRTC image:', error);
    }
  }, [remoteVideoRef, rosImageRef, placeholderRef]);

  const stopReceiving = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setIsReceiving(false);
    setStreamStatus('OFFLINE');
    setStatus({ message: 'Waiting for new connection...', type: 'waiting' });
  }, []);

  const handleOffer = useCallback(async (data) => {
    try {
      setStatus({ message: 'Received offer - setting up connection...', type: 'info' });
      
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      
      peerConnectionRef.current = pc;

      pc.ondatachannel = (event) => {
        const channel = event.channel;
        dataChannelRef.current = channel;
        
        channel.onopen = () => {
          setStatus({ message: 'Data channel open - receiving images!', type: 'success' });
          setIsReceiving(true);
          setStreamStatus('LIVE');
        };
        
        channel.onmessage = (event) => {
          handleWebRTCImage(event.data);
        };
        
        channel.onclose = () => {
          setStatus({ message: 'Data channel closed', type: 'error' });
          stopReceiving();
        };
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && sendMessageRef.current) {
          sendMessageRef.current('ice-candidate', { candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log('WebRTC connection state:', state);
        switch (state) {
          case 'connected':
            setStatus({ message: 'WebRTC Connected - waiting for data channel...', type: 'success' });
            break;
          case 'disconnected':
          case 'failed':
            setStatus({ message: 'Connection lost', type: 'error' });
            stopReceiving();
            break;
        }
      };

      await pc.setRemoteDescription(data.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (sendMessageRef.current) {
        sendMessageRef.current('answer', { answer });
        setStatus({ message: 'Answer sent - establishing connection...', type: 'info' });
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      setStatus({ message: `Error: ${error.message}`, type: 'error' });
    }
  }, [handleWebRTCImage, stopReceiving]);

  const { sendMessage, isConnected } = useWebSocket({
    onOffer: handleOffer,
    onIceCandidate: async (data) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    },
    onPeerDisconnected: () => {
      setStatus({ message: 'Sender disconnected', type: 'error' });
      stopReceiving();
    },
    setStatus
  });

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  useEffect(() => {
    return () => {
      stopReceiving();
    };
  }, [stopReceiving]);

  return {
    status,
    isReceiving,
    isConnected,
    streamStatus
  };
};

export default useWebRTC;
