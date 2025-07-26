# Face Analysis System

A simple face recognition system that monitors late arrivals using simulated face detection.

## 🚀 Features

- **Simulated Face Recognition**: Recognizes known faces (sangavi, yuvaraj)
- **Late Arrival Monitoring**: Automatically logs arrivals after 8:30 AM
- **Dashboard Analytics**: View attendance records with filtering and search
- **Multi-channel Notifications**: Email, SMS, WhatsApp, and Telegram alerts
- **PDF Export**: Generate attendance reports
- **Responsive Design**: Works on desktop and mobile devices

## 📋 Prerequisites

- Node.js 16+ and npm
- Modern web browser with camera access

## 🛠️ Installation

```bash
npm install
```

## 🚀 Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📸 Using the System

### Camera View:
1. Click "Start Camera" to begin face detection
2. Position yourself in front of the camera
3. The system will simulate recognizing faces (sangavi or yuvaraj)
4. Late arrivals (after 8:30 AM) are automatically logged

### Dashboard:
1. View all late arrival records
2. Filter by person or search by name
3. Export individual or complete reports
4. Send notifications via multiple channels

## 🔧 Configuration

### Known Faces:
- Currently recognizes: **sangavi** and **yuvaraj**
- To modify, edit `src/data/mockData.ts`

### Late Time Setting:
- Default: 8:30 AM
- To change, modify `useFaceRecognition.ts`

### Recognition Frequency:
- Default: Every 4 seconds with 40% detection chance
- Adjust in `useFaceRecognition.ts`

## 📱 Notifications

The system supports multiple notification channels:

- **Email**: Opens default email client
- **SMS**: Opens SMS app with message
- **WhatsApp**: Opens WhatsApp with formatted message
- **Telegram**: Opens Telegram to share report

## 📊 Data Storage

- **Attendance Records**: Stored in memory (`src/data/mockData.ts`)
- **Known Faces**: sangavi, yuvaraj (hardcoded)

## 🔒 Security Notes

- Camera access is required for the interface
- All processing is simulated (no actual face recognition)
- No data is sent to external servers
- All data is stored locally in browser memory

## 📝 License

This project is licensed under the MIT License.