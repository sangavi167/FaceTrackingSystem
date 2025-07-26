import { AttendanceRecord } from '../types';
import { secureStorage } from '../utils/secureStorage';

// Function to load attendance from CSV data (legacy support)
const loadAttendanceFromCSV = (): AttendanceRecord[] => {
  // This would normally read from the actual CSV file
  // For now, we'll use the existing CSV data you provided
  const csvData = [
    { name: 'Yuvaraj', date: '2025-06-24', time: '22:02:41' },
    { name: 'sangavi', date: '2025-06-25', time: '09:30:24' },
    { name: 'sangavi', date: '2025-06-25', time: '09:30:52' },
    { name: 'sangavi', date: '2025-06-25', time: '09:31:44' },
    { name: 'sangavi', date: '2025-06-25', time: '15:14:39' },
    { name: 'sangavi', date: '2025-06-25', time: '15:18:40' },
    { name: 'sangavi', date: '2025-06-25', time: '15:48:12' },
    { name: 'sangavi', date: '2025-06-25', time: '16:29:15' },
    { name: 'sangavi', date: '2025-06-25', time: '16:37:32' },
    { name: 'sangavi', date: '2025-06-25', time: '16:57:37' },
    { name: 'sangavi', date: '2025-06-26', time: '10:15:05' },
    { name: 'sangavi', date: '2025-06-26', time: '10:17:19' },
    { name: 'sangavi', date: '2025-06-26', time: '10:38:04' },
    { name: 'sangavi', date: '2025-06-26', time: '11:00:14' },
    { name: 'sangavi', date: '2025-06-26', time: '11:46:28' }
  ];

  return csvData.map((record, index) => {
    const [hours, minutes] = record.time.split(':').map(Number);
    const isLate = hours > 8 || (hours === 8 && minutes > 30);
    
    return {
      id: (index + 1).toString(),
      name: record.name,
      date: record.date,
      checkInTime: record.time,
      timestamp: new Date(`${record.date}T${record.time}`),
      isLate,
      status: isLate ? 'late' : 'checked-in'
    };
  });
};

// Initialize with CSV data and filter to show only late arrivals
export let mockAttendanceRecords: AttendanceRecord[] = loadAttendanceFromCSV().filter(record => record.isLate);

// Function to add new check-in record (legacy support)
export const addCheckInRecord = (name: string): AttendanceRecord => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const checkInTime = now.toTimeString().split(' ')[0];
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isLate = hours > 8 || (hours === 8 && minutes > 30);

  const newRecord: AttendanceRecord = {
    id: (mockAttendanceRecords.length + 1).toString(),
    name,
    date,
    checkInTime,
    timestamp: now,
    isLate,
    status: isLate ? 'late' : 'checked-in'
  };

  // Add all check-ins (not just late ones)
  mockAttendanceRecords.unshift(newRecord); // Add to beginning for latest first
  
  // Also add to secure storage
  secureStorage.addCheckInRecord(name, 'face', 0.85);

  return newRecord;
};

// Function to add check-out record
export const addCheckOutRecord = (name: string): AttendanceRecord | null => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const checkOutTime = now.toTimeString().split(' ')[0];

  // Find today's check-in record for this person
  const todayCheckIn = mockAttendanceRecords.find(record => 
    record.name === name && 
    record.date === date && 
    record.status !== 'checked-out'
  );

  if (!todayCheckIn) {
    console.warn(`⚠️ No check-in record found for ${name} today`);
    return null;
  }

  // Calculate working hours
  const checkInTime = new Date(`${date}T${todayCheckIn.checkInTime}`);
  const checkOutTimestamp = now;
  const workingHours = (checkOutTimestamp.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

  // Update the existing record
  todayCheckIn.checkOutTime = checkOutTime;
  todayCheckIn.checkOutTimestamp = checkOutTimestamp;
  todayCheckIn.status = 'checked-out';
  todayCheckIn.workingHours = Math.round(workingHours * 100) / 100;

  // Also update in secure storage
  secureStorage.addCheckOutRecord(name, 'face', 0.85);

  return todayCheckIn;
};
// Function to get all attendance records (combines legacy and secure storage)
export const getAttendanceRecords = (): AttendanceRecord[] => {
  // Get secure records
  const secureRecords = secureStorage.getAttendanceRecords();
  
  // Convert secure records to legacy format
  const convertedSecureRecords: AttendanceRecord[] = secureRecords.map(record => ({
    id: record.id,
    name: record.name,
    date: record.date,
    checkInTime: record.time,
    checkOutTime: record.checkOutTime,
    timestamp: record.timestamp,
    checkOutTimestamp: record.checkOutTimestamp,
    isLate: record.isLate,
    status: record.status,
    workingHours: record.workingHours
  }));

  // Combine with legacy records (remove duplicates by ID)
  const allRecords = [...convertedSecureRecords, ...mockAttendanceRecords];
  const uniqueRecords = allRecords.filter((record, index, self) => 
    index === self.findIndex(r => r.id === record.id)
  );

  // Sort by timestamp (newest first)
  return uniqueRecords.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// Known faces from the known_faces folder
export const knownFaces = ['sangavi', 'Yuvaraj']; // These should match the photo filenames