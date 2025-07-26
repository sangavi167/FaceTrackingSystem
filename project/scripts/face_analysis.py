import face_recognition
import cv2
import os
import numpy as np
from datetime import datetime
import csv

# === Load known faces ===
known_face_encodings = []
known_face_names = []

# Automatically get absolute path to known_faces folder
script_dir = os.path.dirname(os.path.abspath(__file__))
known_dir = os.path.join(script_dir, "../known_faces")

if not os.path.exists(known_dir):
    print(f"❌ ERROR: known_faces directory not found at {known_dir}")
    exit()

for file_name in os.listdir(known_dir):
    if file_name.lower().endswith(('.jpg', '.jpeg', '.png')):
        image_path = os.path.join(known_dir, file_name)
        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)
        if encodings:
            known_face_encodings.append(encodings[0])
            known_face_names.append(os.path.splitext(file_name)[0])
        else:
            print(f"[WARNING] No face found in {file_name}.")

# === Setup CSV for attendance ===
attendance_file = os.path.join(script_dir, "../attendance.csv")

def log_attendance(name):
    now = datetime.now()
    date = now.strftime("%Y-%m-%d")
    time = now.strftime("%H:%M:%S")
    with open(attendance_file, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([name, date, time])
    print(f"{name} recognized at {time} - On time (logged to CSV)")

# Avoid duplicate logging in a session
logged_names = set()

# Try to access webcam from index 0, 1, 2
video_capture = None
for i in range(3):
    cap = cv2.VideoCapture(i)
    if cap.isOpened():
        video_capture = cap
        print(f"✅ Camera opened at index {i}")
        break

if not video_capture or not video_capture.isOpened():
    print("❌ ERROR: Could not access the webcam.")
    exit()

# === Main loop ===
while True:
    ret, frame = video_capture.read()
    if not ret:
        print("❌ ERROR: Failed to grab frame from webcam.")
        break

    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(rgb_small_frame)
    face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

    for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
        matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
        face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
        name = "Unknown"

        if len(face_distances) > 0:
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                name = known_face_names[best_match_index]

        if name != "Unknown":
            if name not in logged_names:
                log_attendance(name)
                logged_names.add(name)
                print("✅ Face recognized. Closing webcam...")
                video_capture.release()
                cv2.destroyAllWindows()
                exit()

        # Draw rectangle and label
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
        cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)

    # Show the video frame
    cv2.imshow('Video', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("👋 Exiting on user request.")
        break

# === Cleanup ===
video_capture.release()
cv2.destroyAllWindows()
