export interface AttendanceRecord {
  id: string;
  name: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  timestamp: Date;
  checkOutTimestamp?: Date;
  isLate: boolean;
  status: 'checked-in' | 'checked-out' | 'late' | 'absent';
  workingHours?: number;
}

export interface RecognizedFace {
  name: string;
  confidence: number;
  isLate: boolean;
  action: 'check-in' | 'check-out';
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'student' | 'teacher';
  department: string;
  position: string;
  joinDate: string;
  employeeId: string; // Can be studentId or teacherId
  isActive: boolean;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  requestedToTeacherId?: string;
  requestedToTeacherName?: string;
  leaveType: 'sick' | 'casual' | 'annual' | 'maternity' | 'emergency';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  reviewComments?: string;
  attachments?: string[];
}

export interface ODApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  requestedToTeacherId?: string;
  requestedToTeacherName?: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  rejectionReason?: string;
  approvalComments?: string;
}

export interface Incident {
  id: string;
  employeeId: string;
  employeeName: string;
  incidentType: 'disciplinary' | 'safety' | 'performance' | 'attendance' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  date: string;
  reportedBy: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  actionTaken?: string;
  followUpRequired: boolean;
  followUpDate?: string;
}

export interface CalendarEvent {
  id: string;
  employeeId: string;
  date: string;
  type: 'leave' | 'od' | 'absent' | 'present' | 'late' | 'holiday';
  title: string;
  description?: string;
  status?: string;
}