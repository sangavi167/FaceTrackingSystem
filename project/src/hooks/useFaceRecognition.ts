import { useState, useEffect, useRef } from 'react';
import { RecognizedFace } from '../types';
import { addCheckInRecord, addCheckOutRecord } from '../data/mockData';
import { voiceAnnouncer } from '../utils/voiceAnnouncements';

export const useFaceRecognition = (isActive: boolean, attendanceMode: 'check-in' | 'check-out') => {
  const [recognizedFace, setRecognizedFace] = useState<RecognizedFace | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRecognizedName, setLastRecognizedName] = useState<string | null>(null);
  const [lastAnnouncementTime, setLastAnnouncementTime] = useState<number>(0);
  const [lastAttendanceMode, setLastAttendanceMode] = useState<'check-in' | 'check-out'>('check-in');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanAnnouncementRef = useRef<NodeJS.Timeout | null>(null);

  // Reset recognition when mode changes
  useEffect(() => {
    if (attendanceMode !== lastAttendanceMode) {
      setRecognizedFace(null);
      setLastRecognizedName(null);
      setLastAttendanceMode(attendanceMode);
    }
  }, [attendanceMode, lastAttendanceMode]);
  useEffect(() => {
    if (!isActive) {
      setRecognizedFace(null);
      setLastRecognizedName(null);
      setLastAnnouncementTime(0);
      
      // Clear intervals
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      if (scanAnnouncementRef.current) {
        clearTimeout(scanAnnouncementRef.current);
        scanAnnouncementRef.current = null;
      }
      
      return;
    }

    // Announce camera started and initial scan instruction
    voiceAnnouncer.announceStartScanning(attendanceMode);

    // Create canvas for capturing frames
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    // Announce "scan your face" every 10 seconds if no face is recognized
    const scheduleNextScanAnnouncement = () => {
      if (scanAnnouncementRef.current) {
        clearTimeout(scanAnnouncementRef.current);
      }
      
      scanAnnouncementRef.current = setTimeout(() => {
        if (isActive && !lastRecognizedName) {
          voiceAnnouncer.announceScanning(attendanceMode);
          scheduleNextScanAnnouncement();
        }
      }, 10000); // Every 10 seconds
    };

    scheduleNextScanAnnouncement();

    const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.videoWidth === 0) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      try {
        setIsProcessing(true);

        // Announce processing (but not too frequently)
        const now = Date.now();
        if (now - lastAnnouncementTime > 15000) { // Every 15 seconds max
          voiceAnnouncer.announceProcessing();
          setLastAnnouncementTime(now);
        }

        // Send frame to face recognition API
        const response = await fetch('http://localhost:5000/api/recognize-face', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: imageData }),
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.name && result.name !== lastRecognizedName) {
            // Clear the scan announcement timeout since we found a face
            if (scanAnnouncementRef.current) {
              clearTimeout(scanAnnouncementRef.current);
              scanAnnouncementRef.current = null;
            }

            // Handle attendance based on mode
            let attendanceResult = null;
            let isLate = false;
            
            if (attendanceMode === 'check-in') {
              const currentTime = new Date();
              isLate = currentTime.getHours() > 8 || (currentTime.getHours() === 8 && currentTime.getMinutes() > 30);
              attendanceResult = addCheckInRecord(result.name);
              console.log(`${result.name} checked in at ${currentTime.toLocaleTimeString()}`);
            } else {
              attendanceResult = addCheckOutRecord(result.name);
              if (attendanceResult) {
                console.log(`${result.name} checked out at ${new Date().toLocaleTimeString()}, worked ${attendanceResult.workingHours} hours`);
              } else {
                console.log(`${result.name} attempted check-out but no check-in record found for today`);
              }
            }
            
            setRecognizedFace({
              name: result.name,
              confidence: result.confidence,
              isLate,
              action: attendanceMode
            });

            // Voice announcement for recognition
            if (attendanceMode === 'check-in') {
              voiceAnnouncer.announceFaceRecognized(result.name, isLate, 'check-in');
            } else {
              if (attendanceResult) {
                voiceAnnouncer.announceFaceRecognized(result.name, false, 'check-out', attendanceResult.workingHours);
              } else {
                voiceAnnouncer.announceCheckOutError(result.name);
              }
            }

            setLastRecognizedName(result.name);
            
            // Reset announcement timer
            setLastAnnouncementTime(now);
            
          } else if (!result.name) {
            // No known face detected
            setRecognizedFace({
              name: 'Unknown',
              confidence: 0,
              isLate: false,
              action: attendanceMode
            });

            // Announce unknown face (but not too frequently)
            if (now - lastAnnouncementTime > 20000) { // Every 20 seconds for unknown
              voiceAnnouncer.announceNoFaceDetected();
              setLastAnnouncementTime(now);
            }
          }
        }
      } catch (error) {
        console.error('Face recognition error:', error);
        
        // Show API connection status
        setRecognizedFace({
          name: 'API Error',
          confidence: 0,
          isLate: false,
          action: attendanceMode
        });

        // Announce API error (but not too frequently)
        const now = Date.now();
        if (now - lastAnnouncementTime > 30000) { // Every 30 seconds for errors
          voiceAnnouncer.announceFaceRecognized('API Error', false, attendanceMode);
          setLastAnnouncementTime(now);
        }
      } finally {
        setIsProcessing(false);
      }
    };

    // Process frames every 3 seconds
    processingIntervalRef.current = setInterval(processFrame, 3000);

    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
      if (scanAnnouncementRef.current) {
        clearTimeout(scanAnnouncementRef.current);
      }
    };
  }, [isActive, lastRecognizedName, lastAnnouncementTime, attendanceMode]);

  // Expose video ref for camera component
  const setVideoRef = (ref: HTMLVideoElement | null) => {
    if (ref) {
      videoRef.current = ref;
    }
  };

  return { recognizedFace, isProcessing, setVideoRef };
};