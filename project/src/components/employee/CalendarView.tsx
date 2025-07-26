import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { authManager } from '../../utils/authManager';
import { hrManager } from '../../utils/hrManager';
import { getAttendanceRecords } from '../../data/mockData';
import { CalendarEvent, AttendanceRecord } from '../../types';

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const currentUser = authManager.getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      loadCalendarData();
    }
  }, [currentUser, currentDate]);

  const loadCalendarData = () => {
    const monthStr = currentDate.toISOString().substring(0, 7); // YYYY-MM format
    
    // Load calendar events (leaves, ODs)
    const events = hrManager.getCalendarEvents(currentUser?.id, monthStr);
    setCalendarEvents(events);
    
    // Load attendance records
    const allAttendance = getAttendanceRecords();
    const userAttendance = allAttendance.filter(record => 
      record.name.toLowerCase() === currentUser?.username.toLowerCase() &&
      record.date.startsWith(monthStr)
    );
    setAttendanceRecords(userAttendance);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getDateString = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const getEventsForDate = (day: number) => {
    const dateStr = getDateString(day);
    return calendarEvents.filter(event => event.date === dateStr);
  };

  const getAttendanceForDate = (day: number) => {
    const dateStr = getDateString(day);
    return attendanceRecords.find(record => record.date === dateStr);
  };

  const getDayStatus = (day: number) => {
    const events = getEventsForDate(day);
    const attendance = getAttendanceForDate(day);
    const dateStr = getDateString(day);
    const today = new Date().toISOString().split('T')[0];
    const isPastDate = dateStr < today;
    
    // Check for approved leave
    const approvedLeave = events.find(event => 
      event.type === 'leave' && event.status === 'approved'
    );
    
    if (approvedLeave) {
      return { type: 'leave', label: 'On Leave', color: 'bg-red-100 text-red-800' };
    }
    
    // Check for pending leave
    const pendingLeave = events.find(event => 
      event.type === 'leave' && event.status === 'pending'
    );
    
    if (pendingLeave) {
      return { type: 'pending', label: 'Leave Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
    
    // Check attendance
    if (attendance) {
      if (attendance.status === 'checked-out') {
        return { type: 'present', label: 'Present', color: 'bg-green-100 text-green-800' };
      } else if (attendance.isLate) {
        return { type: 'late', label: 'Late', color: 'bg-orange-100 text-orange-800' };
      } else {
        return { type: 'present', label: 'Present', color: 'bg-green-100 text-green-800' };
      }
    }
    
    // If it's a past date with no attendance or leave, mark as absent
    if (isPastDate) {
      return { type: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800' };
    }
    
    return null;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (day: number) => {
    const dateStr = getDateString(day);
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const getSelectedDateDetails = () => {
    if (!selectedDate) return null;
    
    const events = calendarEvents.filter(event => event.date === selectedDate);
    const attendance = attendanceRecords.find(record => record.date === selectedDate);
    
    return { events, attendance };
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDetails = getSelectedDateDetails();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Monthly Calendar</h2>
            <p className="text-gray-600">
              Track your attendance, leaves, and activities for {currentUser?.fullName}
            </p>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <h3 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Calendar Header */}
            <div className="bg-blue-600 text-white p-4">
              <div className="grid grid-cols-7 gap-1">
                {dayNames.map(day => (
                  <div key={day} className="text-center font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Calendar Body */}
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="h-20"></div>;
                  }
                  
                  const dayStatus = getDayStatus(day);
                  const dateStr = getDateString(day);
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  const isSelected = selectedDate === dateStr;
                  
                  return (
                    <div
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`h-20 border border-gray-200 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      } ${isToday ? 'bg-blue-100' : ''}`}
                    >
                      <div className="flex flex-col h-full">
                        <span className={`text-sm font-medium ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {day}
                        </span>
                        
                        {dayStatus && (
                          <div className={`mt-1 px-1 py-0.5 rounded text-xs font-medium ${dayStatus.color} text-center`}>
                            {dayStatus.type === 'present' && <CheckCircle className="h-3 w-3 mx-auto" />}
                            {dayStatus.type === 'late' && <Clock className="h-3 w-3 mx-auto" />}
                            {dayStatus.type === 'absent' && <XCircle className="h-3 w-3 mx-auto" />}
                            {dayStatus.type === 'leave' && <CalendarIcon className="h-3 w-3 mx-auto" />}
                            {dayStatus.type === 'pending' && <AlertTriangle className="h-3 w-3 mx-auto" />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend and Details */}
        <div className="space-y-6">
          {/* Legend */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Legend</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 rounded mr-3 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Present</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-100 rounded mr-3 flex items-center justify-center">
                  <Clock className="h-3 w-3 text-orange-600" />
                </div>
                <span className="text-sm text-gray-700">Late Arrival</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 rounded mr-3 flex items-center justify-center">
                  <XCircle className="h-3 w-3 text-red-600" />
                </div>
                <span className="text-sm text-gray-700">Absent</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 rounded mr-3 flex items-center justify-center">
                  <CalendarIcon className="h-3 w-3 text-red-600" />
                </div>
                <span className="text-sm text-gray-700">On Leave</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 rounded mr-3 flex items-center justify-center">
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-700">Leave Pending</span>
              </div>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && selectedDetails && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              
              {/* Attendance Details */}
              {selectedDetails.attendance && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Attendance</h5>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Check In:</span>
                        <span className="ml-2 font-medium">{selectedDetails.attendance.checkInTime}</span>
                      </div>
                      {selectedDetails.attendance.checkOutTime && (
                        <div>
                          <span className="text-gray-600">Check Out:</span>
                          <span className="ml-2 font-medium">{selectedDetails.attendance.checkOutTime}</span>
                        </div>
                      )}
                      {selectedDetails.attendance.workingHours && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Working Hours:</span>
                          <span className="ml-2 font-medium">{selectedDetails.attendance.workingHours}h</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Events Details */}
              {selectedDetails.events.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Events</h5>
                  <div className="space-y-2">
                    {selectedDetails.events.map((event, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{event.title}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.status === 'approved' ? 'bg-green-100 text-green-800' :
                            event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!selectedDetails.attendance && selectedDetails.events.length === 0 && (
                <p className="text-gray-500 text-sm">No events or attendance recorded for this date.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};