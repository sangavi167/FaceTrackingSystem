import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Mock data for known faces - only these will be recognized
const mockKnownFaces = ['sangavi', 'yuvaraj'];

// Mock face recognition endpoint
app.post('/api/recognize-face', (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Simulate face recognition processing delay
    setTimeout(() => {
      const random = Math.random();
      
      if (random < 0.3) {
        // 30% chance of recognizing a known face
        const randomFace = mockKnownFaces[Math.floor(Math.random() * mockKnownFaces.length)];
        const confidence = 0.75 + (Math.random() * 0.25); // Random confidence between 0.75-1.0
        
        console.log(`✅ Mock recognition: ${randomFace} (confidence: ${confidence.toFixed(2)})`);
        
        res.json({
          name: randomFace,
          confidence: parseFloat(confidence.toFixed(2)),
          distance: parseFloat((1 - confidence).toFixed(2)),
          face_location: [50, 200, 150, 100], // Mock face location
          message: `Recognized ${randomFace}`
        });
      } else {
        // 70% chance of no known face detected
        console.log('👁️ Mock: No known face detected');
        res.json({
          name: null,
          confidence: 0,
          message: 'No known face detected'
        });
      }
    }, 800); // Simulate processing delay
    
  } catch (error) {
    console.error('Error in mock face recognition:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reload faces endpoint
app.post('/api/reload-faces', (req, res) => {
  console.log('📁 Mock: Reloading known faces');
  res.json({
    message: 'Known faces reloaded successfully (mock)',
    loaded_faces: mockKnownFaces,
    total_count: mockKnownFaces.length
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    known_faces: mockKnownFaces,
    total_faces: mockKnownFaces.length,
    tolerance: 0.6,
    message: 'Mock Face Recognition API is running - only known faces recognized'
  });
});

// Test recognition endpoint
app.get('/api/test-recognition', (req, res) => {
  res.json({
    known_faces_count: mockKnownFaces.length,
    known_faces: mockKnownFaces,
    encodings_loaded: mockKnownFaces.length,
    status: 'ready'
  });
});

const PORT = 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Mock Face Recognition API Server started');
  console.log(`📁 Mock known faces: ${mockKnownFaces.join(', ')}`);
  console.log(`🔧 Using mock tolerance: 0.6`);
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  console.log('⚠️  This is a MOCK server for development purposes');
  console.log('✅ Only known faces will be recognized - unknown faces ignored');
  console.log('🎯 Recognition rate: ~30% chance per frame');
});