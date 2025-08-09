import React, { useState, useEffect } from 'react';
import { Camera, CameraOff, Loader2, User, Clock, CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff, Volume2, VolumeX, LogIn, LogOut } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useFaceRecognition } from '../hooks/useFaceRecognition';
import { voiceAnnouncer } from '../utils/voiceAnnouncements';

export const CameraView: React.FC = () => {
  const { videoRef, isActive, error, startCamera, stopCamera } = useCamera();
  const [attendanceMode, setAttendanceMode] = useState<'check-in' | 'check-out'>('check-in');
  const { recognizedFace, isProcessing, setVideoRef } = useFaceRecognition(isActive, attendanceMode);
  const [lastRecognition, setLastRecognition] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Set camera view as active when component mounts
  useEffect(() => {
    voiceAnnouncer.setOnCameraView(true);
    
    // Cleanup when component unmounts
    return () => {
      voiceAnnouncer.setOnCameraView(false);
    };
  }, []);

  React.useEffect(() => {
    if (recognizedFace && recognizedFace.name !== lastRecognition) {
      setLastRecognition(recognizedFace.name);
    }
  }, [recognizedFace, lastRecognition]);

  React.useEffect(() => {
    if (videoRef.current) {
      setVideoRef(videoRef.current);
    }
  }, [videoRef, setVideoRef]);

  // Check API status
  React.useEffect(() => {
    const checkAPI = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/status');
        if (response.ok) {
          setApiStatus('connected');
        } else {
          setApiStatus('disconnected');
        }
      } catch (error) {
        setApiStatus('disconnected');
      }
    };

    checkAPI();
    const interval = setInterval(checkAPI, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleVoice = () => {
    voiceAnnouncer.toggle();
    setIsVoiceEnabled(voiceAnnouncer.isVoiceEnabled());
  };

  const testVoice = () => {
    voiceAnnouncer.testVoice();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Real Face Recognition</h2>
              <p className="text-blue-100">Check-in and Check-out System</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Attendance Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAttendanceMode('check-in')}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    attendanceMode === 'check-in'
                      ? 'bg-green-600 text-white'
                      : 'bg-white bg-opacity-20 text-blue-100 hover:bg-opacity-30'
                  }`}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Check In
                </button>
                <button
                  onClick={() => setAttendanceMode('check-out')}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    attendanceMode === 'check-out'
                      ? 'bg-red-600 text-white'
                      : 'bg-white bg-opacity-20 text-blue-100 hover:bg-opacity-30'
                  }`}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Check Out
                </button>
              </div>

              {/* Voice Control */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleVoice}
                  className={`p-2 rounded-lg transition-colors ${
                    isVoiceEnabled 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}
                  title={isVoiceEnabled ? 'Disable Voice' : 'Enable Voice'}
                >
                  {isVoiceEnabled ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={testVoice}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                  title="Test Voice"
                >
                  Test
                </button>
              </div>

              {/* API Status */}
              <div className="flex items-center space-x-2">
                {apiStatus === 'connected' ? (
                  <div className="flex items-center text-green-200">
                    <Wifi className="h-5 w-5 mr-2" />
                    <span className="text-sm">API Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-200">
                    <WifiOff className="h-5 w-5 mr-2" />
                    <span className="text-sm">API Disconnected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Attendance Mode Status */}
          <div className={`mb-4 p-4 rounded-lg border ${
            attendanceMode === 'check-in' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {attendanceMode === 'check-in' ? (
                <LogIn className="h-6 w-6 text-green-600 mr-3" />
              ) : (
                <LogOut className="h-6 w-6 text-red-600 mr-3" />
              )}
              <div>
                <h4 className={`font-medium ${
                  attendanceMode === 'check-in' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {attendanceMode === 'check-in' ? 'Check-In Mode' : 'Check-Out Mode'}
                </h4>
                <p className={`text-sm ${
                  attendanceMode === 'check-in' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {attendanceMode === 'check-in' 
                    ? 'System will record your arrival time'
                    : 'System will record your departure time and calculate working hours'
                  }
                </p>
              </div>
            </div>
          </div>
          {/* Voice Status */}
          <div className={`mb-4 p-3 rounded-lg border ${
            isVoiceEnabled 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center">
              {isVoiceEnabled ? (
                <Volume2 className="h-5 w-5 text-green-600 mr-3" />
              ) : (
                <VolumeX className="h-5 w-5 text-gray-600 mr-3" />
              )}
              <div>
                <h4 className={`font-medium ${isVoiceEnabled ? 'text-green-900' : 'text-gray-900'}`}>
                  Voice Announcements {isVoiceEnabled ? 'Enabled' : 'Disabled'}
                </h4>
                <p className={`text-sm ${isVoiceEnabled ? 'text-green-700' : 'text-gray-700'}`}>
                  {isVoiceEnabled 
                    ? 'System will announce scan instructions and recognition results (Camera view only)'
                    : 'Voice announcements are turned off'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* API Status Warning */}
          {apiStatus === 'disconnected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h4 className="font-medium text-red-900">Face Recognition API Not Running</h4>
                  <p className="text-red-700 text-sm mt-1">
                    Start the Python API server: <code className="bg-red-100 px-2 py-1 rounded">python scripts/face_recognition_api.py</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Camera Controls */}
          <div className="flex justify-center mb-6">
            <button
              onClick={isActive ? stopCamera : startCamera}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isActive ? (
                <>
                  <CameraOff className="h-5 w-5 mr-2" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5 mr-2" />
                  Start Camera
                </>
              )}
            </button>
          </div>

          {/* Camera Feed */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-6">
            {error ? (
              <div className="flex items-center justify-center h-96 text-red-400">
                <div className="text-center">
                  <XCircle className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Camera Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-96 object-cover"
                  style={{ display: isActive ? 'block' : 'none' }}
                />
                
                {!isActive && (
                  <div className="flex items-center justify-center h-96 text-gray-400">
                    <div className="text-center">
                      <Camera className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">Camera Inactive</p>
                      <p className="text-sm">Click "Start Camera" to begin face recognition</p>
                    </div>
                  </div>
                )}

                {/* Processing Indicator */}
                {isProcessing && isActive && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </div>
                )}

                {/* Voice Status Indicator */}
                {isActive && (
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full flex items-center ${
                    isVoiceEnabled 
                      ? 'bg-green-600 bg-opacity-90 text-white' 
                      : 'bg-gray-600 bg-opacity-90 text-white'
                  }`}>
                    {isVoiceEnabled ? (
                      <Volume2 className="h-4 w-4 mr-2" />
                    ) : (
                      <VolumeX className="h-4 w-4 mr-2" />
                    )}
                    <span className="text-sm">
                      Voice {isVoiceEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                )}

                {/* Face Recognition Overlay */}
                {recognizedFace && isActive && (
                  <div className={`absolute bottom-4 left-4 right-4 text-white p-4 rounded-lg ${
                    recognizedFace.name === 'Unknown' ? 'bg-red-600 bg-opacity-90' : 
                    recognizedFace.name === 'API Error' ? 'bg-orange-600 bg-opacity-90' :
                    recognizedFace.action === 'check-in' ? 'bg-green-600 bg-opacity-90' : 'bg-blue-600 bg-opacity-90'
                  }`}>
                    <div className="flex items-center mb-2">
                      {recognizedFace.action === 'check-in' ? (
                        <LogIn className="h-5 w-5 mr-2" />
                      ) : (
                        <LogOut className="h-5 w-5 mr-2" />
                      )}
                      <span className="font-medium">
                        {recognizedFace.name === 'Unknown' ? 'Unknown Person' :
                         recognizedFace.name === 'API Error' ? 'API Connection Error' :
                         `${recognizedFace.action === 'check-in' ? 'Check-In' : 'Check-Out'} Successful`}
                      </span>
                    </div>
                    <p className="text-lg font-bold">{recognizedFace.name}</p>
                    {recognizedFace.confidence > 0 && (
                      <p className="text-sm opacity-90">
                        Confidence: {(recognizedFace.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                    {recognizedFace.action === 'check-in' && recognizedFace.isLate && (
                      <p className="text-sm opacity-90 mt-1">
                        ⚠️ Late Arrival (after 8:30 AM)
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recognition Status */}
          {recognizedFace && recognizedFace.name !== 'Unknown' && recognizedFace.name !== 'API Error' && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${
                    recognizedFace.action === 'check-in' 
                      ? (recognizedFace.isLate ? 'bg-red-100' : 'bg-green-100')
                      : 'bg-blue-100'
                  } mr-4`}>
                    {recognizedFace.action === 'check-in' ? (
                      recognizedFace.isLate ? (
                        <Clock className="h-6 w-6 text-red-600" />
                      ) : (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      )
                    ) : (
                      <LogOut className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{recognizedFace.name}</h3>
                    <p className={`text-sm font-medium ${
                      recognizedFace.action === 'check-in'
                        ? (recognizedFace.isLate ? 'text-red-600' : 'text-green-600')
                        : 'text-blue-600'
                    }`}>
                      {recognizedFace.action === 'check-in' 
                        ? (recognizedFace.isLate ? 'Late Check-In Recorded' : 'On-Time Check-In Recorded')
                        : 'Check-Out Recorded - Working Hours Calculated'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {recognizedFace.action === 'check-in' ? 'Checked In at' : 'Checked Out at'}
                  </p>
                  <p className="text-lg font-medium text-gray-900">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          
        </div>
      </div>
    </div>
  );
};
