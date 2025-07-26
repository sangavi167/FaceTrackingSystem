// Voice announcement utilities for face recognition system

export class VoiceAnnouncer {
  private synthesis: SpeechSynthesis;
  private isEnabled: boolean = true;
  private isOnCameraView: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeVoice();
  }

  private initializeVoice() {
    // Wait for voices to load
    const setVoice = () => {
      const voices = this.synthesis.getVoices();
      
      // Prefer English voices
      const englishVoices = voices.filter(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.default)
      );
      
      // Use the first available English voice or default
      this.voice = englishVoices[0] || voices[0] || null;
      
      console.log('🔊 Voice initialized:', this.voice?.name || 'Default system voice');
    };

    if (this.synthesis.getVoices().length > 0) {
      setVoice();
    } else {
      this.synthesis.addEventListener('voiceschanged', setVoice);
    }
  }

  private speak(text: string, options: { rate?: number; pitch?: number; volume?: number } = {}) {
    // Only speak if enabled AND on camera view
    if (!this.isEnabled || !this.isOnCameraView) return;

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice properties
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;
    
    // Add some personality to the voice
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher pitch for friendliness

    console.log('🔊 Speaking:', text);
    this.synthesis.speak(utterance);
  }

  // View control methods
  setOnCameraView(isOnCamera: boolean) {
    this.isOnCameraView = isOnCamera;
    
    // Stop any ongoing speech when leaving camera view
    if (!isOnCamera) {
      this.synthesis.cancel();
    }
    
    console.log(`🔊 Voice announcements ${isOnCamera ? 'activated for camera view' : 'deactivated - not on camera view'}`);
  }

  // Announcement methods
  announceStartScanning(mode: 'check-in' | 'check-out' = 'check-in') {
    const message = mode === 'check-in' 
      ? "Please position yourself in front of the camera for check-in. Scanning for your face."
      : "Please position yourself in front of the camera for check-out. Scanning for your face.";
    
    this.speak(message, {
      rate: 0.9,
      pitch: 1.0
    });
  }

  announceScanning(mode: 'check-in' | 'check-out' = 'check-in') {
    const message = mode === 'check-in' ? "Scan your face for check-in" : "Scan your face for check-out";
    this.speak(message, {
      rate: 1.0,
      pitch: 1.1
    });
  }

  announceFaceRecognized(name: string, isLate: boolean, action: 'check-in' | 'check-out', workingHours?: number) {
    if (name === 'Unknown') {
      this.speak("Unknown person detected. Please ensure you are registered in the system.", {
        rate: 0.9,
        pitch: 0.9
      });
      return;
    }

    if (name === 'API Error') {
      this.speak("Face recognition service is unavailable. Please try again later.", {
        rate: 0.9,
        pitch: 0.9
      });
      return;
    }

    const greeting = this.getTimeBasedGreeting();
    
    let statusMessage = "";
    if (action === 'check-in') {
      statusMessage = isLate 
        ? "You have been marked as late arrival. Please see your supervisor."
        : "You are on time. Have a great day!";
    } else {
      statusMessage = workingHours 
        ? `You have worked ${workingHours.toFixed(1)} hours today. Thank you for your service.`
        : "Check-out recorded. Have a safe journey home.";
    }

    const actionText = action === 'check-in' ? 'checked in' : 'checked out';
    this.speak(`${greeting} ${name}. You have been ${actionText} successfully. ${statusMessage}`, {
      rate: 0.9,
      pitch: 1.1
    });
  }

  announceCheckOutError(name: string) {
    this.speak(`${name}, no check-in record found for today. Please check in first before checking out.`, {
      rate: 0.9,
      pitch: 0.9
    });
  }
  announceProcessing() {
    this.speak("Processing your face. Please hold still.", {
      rate: 1.0,
      pitch: 1.0
    });
  }

  announceNoFaceDetected() {
    this.speak("No face detected. Please position yourself properly in front of the camera.", {
      rate: 0.9,
      pitch: 1.0
    });
  }

  announceCameraStarted() {
    this.speak("Camera activated. Face recognition system is ready.", {
      rate: 0.9,
      pitch: 1.1
    });
  }

  announceCameraStopped() {
    this.speak("Camera deactivated. Face recognition system stopped.", {
      rate: 0.9,
      pitch: 1.0
    });
  }

  private getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return "Good morning";
    } else if (hour < 17) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  }

  // Control methods
  enable() {
    this.isEnabled = true;
    console.log('🔊 Voice announcements enabled');
  }

  disable() {
    this.isEnabled = false;
    this.synthesis.cancel();
    console.log('🔇 Voice announcements disabled');
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this.synthesis.cancel();
    }
    console.log(`🔊 Voice announcements ${this.isEnabled ? 'enabled' : 'disabled'}`);
  }

  isVoiceEnabled(): boolean {
    return this.isEnabled;
  }

  // Test voice functionality (only works on camera view)
  testVoice() {
    this.speak("Voice announcement system is working correctly.", {
      rate: 1.0,
      pitch: 1.1
    });
  }
}

// Create singleton instance
export const voiceAnnouncer = new VoiceAnnouncer();