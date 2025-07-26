from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import cv2
import numpy as np
import base64
import os
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Load known faces at startup
known_face_encodings = []
known_face_names = []

def load_known_faces():
    global known_face_encodings, known_face_names
    known_face_encodings = []
    known_face_names = []
    
    known_dir = "../known_faces"
    if not os.path.exists(known_dir):
        print(f"Warning: {known_dir} directory not found")
        return
    
    for file_name in os.listdir(known_dir):
        if file_name.lower().endswith(('.jpg', '.jpeg', '.png')):
            image_path = os.path.join(known_dir, file_name)
            try:
                image = face_recognition.load_image_file(image_path)
                encodings = face_recognition.face_encodings(image)
                if encodings:
                    known_face_encodings.append(encodings[0])
                    known_face_names.append(os.path.splitext(file_name)[0])
                    print(f"✅ Loaded face: {file_name}")
                else:
                    print(f"⚠️ No face found in {file_name}")
            except Exception as e:
                print(f"❌ Error loading {file_name}: {e}")

@app.route('/api/recognize-face', methods=['POST'])
def recognize_face():
    try:
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert PIL image to numpy array
        image_array = np.array(image)
        
        # Convert RGB to BGR for face_recognition
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        # Find faces in the image
        face_locations = face_recognition.face_locations(image_array)
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        if not face_encodings:
            return jsonify({'name': None, 'confidence': 0, 'message': 'No face detected'})
        
        # If no known faces are loaded, return no face
        if not known_face_encodings:
            return jsonify({'name': None, 'confidence': 0, 'message': 'No known faces loaded'})
        
        # Compare with known faces
        for face_encoding in face_encodings:
            # Use tolerance for matching
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.6)
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
            
            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                best_distance = face_distances[best_match_index]
                
                # Only return known faces that match well
                if matches[best_match_index] and best_distance < 0.6:
                    name = known_face_names[best_match_index]
                    confidence = 1 - best_distance  # Convert distance to confidence
                    
                    print(f"✅ Recognized: {name} (confidence: {confidence:.2f}, distance: {best_distance:.2f})")
                    
                    return jsonify({
                        'name': name,
                        'confidence': float(confidence),
                        'distance': float(best_distance),
                        'face_location': face_locations[0] if face_locations else None
                    })
        
        # Face detected but doesn't match any known face - return null instead of Unknown
        print(f"👁️ Face detected but not recognized as known person")
        return jsonify({
            'name': None,
            'confidence': 0,
            'message': 'Face detected but not a known person'
        })
        
    except Exception as e:
        print(f"❌ Error in face recognition: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reload-faces', methods=['POST'])
def reload_faces():
    try:
        load_known_faces()
        return jsonify({
            'message': 'Known faces reloaded successfully',
            'loaded_faces': known_face_names,
            'total_count': len(known_face_names)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        'status': 'running',
        'known_faces': known_face_names,
        'total_faces': len(known_face_names),
        'tolerance': 0.6,
        'message': 'Face Recognition API is running - only known faces recognized'
    })

@app.route('/api/test-recognition', methods=['GET'])
def test_recognition():
    """Test endpoint to check if known faces are loaded properly"""
    return jsonify({
        'known_faces_count': len(known_face_names),
        'known_faces': known_face_names,
        'encodings_loaded': len(known_face_encodings),
        'status': 'ready' if known_face_encodings else 'no_faces_loaded'
    })

if __name__ == '__main__':
    print("🚀 Starting Face Recognition API Server...")
    print("📁 Loading known faces from ../known_faces/")
    load_known_faces()
    print(f"📸 Loaded {len(known_face_names)} known faces: {known_face_names}")
    print("🔧 Using tolerance: 0.6 (balanced matching)")
    print("✅ Only known faces will be recognized - unknown faces ignored")
    print("🌐 Server starting on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)