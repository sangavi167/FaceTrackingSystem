import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Calendar, Clock, TrendingUp, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';
import { format, subDays, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { getAttendanceRecords } from '../data/mockData';
import { AttendanceRecord } from '../types';
import { authManager } from '../utils/authManager';

const VIBRANT_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b', '#ef4444'];

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'custom' | 'all'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = authManager.getCurrentUser();

  const loadAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allRecords = await getAttendanceRecords();
      let userRecords: AttendanceRecord[] = [];
      
      if (currentUser?.role === 'admin') {
        userRecords = allRecords;
      } else if (currentUser?.role === 'student') {
        // Filter records for the specific student
        userRecords = allRecords.filter(record => {
          if (!record || !record.name || !currentUser?.username) {
            return false;
          }
          const recordName = record.name.toLowerCase().trim();
          const userName = currentUser.username.toLowerCase().trim();
          return recordName === userName;
        });
      } else if (currentUser?.role === 'teacher') {
        // Teachers see all records for now, but could be filtered to their students
        userRecords = allRecords;
      }
      
      setAttendanceRecords(userRecords);
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  // Filter records based on time range
  const filteredRecords = useMemo(() => {
    if (!attendanceRecords.length) return [];

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (timeRange) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return attendanceRecords;
        startDate = startOfDay(parseISO(customStartDate));
        endDate = endOfDay(parseISO(customEndDate));
        break;
      case 'all':
      default:
        return attendanceRecords;
    }

    return attendanceRecords.filter(record => {
      if (!record.date) return false;
      const recordDate = parseISO(record.date);
      return isAfter(recordDate, startDate) && isBefore(recordDate, endDate);
    });
  }, [attendanceRecords, timeRange, customStartDate, customEndDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRecords = filteredRecords.length;
    const uniqueStudents = new Set(filteredRecords.map(r => r.name)).size;
    const uniqueDays = new Set(filteredRecords.map(r => r.date)).size;
    
    const lateRecords = filteredRecords.filter(record => {
      if (!record.checkInTime) return false;
      try {
        const checkInHour = parseInt(record.checkInTime.split(':')[0]);
        return checkInHour >= 9; // Assuming 9 AM is the late threshold
      } catch {
        return false;
      }
    }).length;

    const onTimeRecords = totalRecords - lateRecords;
    const averageDaily = uniqueDays > 0 ? Math.round(totalRecords / uniqueDays) : 0;

    return {
      totalRecords,
      uniqueStudents,
      uniqueDays,
      lateRecords,
      onTimeRecords,
      averageDaily,
      latePercentage: totalRecords > 0 ? Math.round((lateRecords / totalRecords) * 100) : 0
    };
  }, [filteredRecords]);

  // Prepare chart data (No changes needed here)
  const chartData = useMemo(() => {
    try {
      // For students, create person data even if it's just one person
      const personData = Object.entries(
        filteredRecords.reduce((acc, record) => {
          if (record && record.name) acc[record.name] = (acc[record.name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

      // Create daily data
      const dailyData = Object.entries(
        filteredRecords.reduce((acc, record) => {
          if (record && record.date) acc[record.date] = (acc[record.date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([date, count]) => ({ 
        date: format(parseISO(date), 'MMM dd'), 
        fullDate: date,
        count 
      })).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

      // Create hourly data
      const hourlyData = filteredRecords.reduce((acc, record) => {
        if (record && record.checkInTime) {
          try {
            const hour = record.checkInTime.split(':')[0];
            acc[hour] = (acc[hour] || 0) + 1;
          } catch (error) {
            console.error('Error parsing check-in time:', record.checkInTime);
          }
        }
        return acc;
      }, {} as Record<string, number>);

      const timeData = Object.entries(hourlyData).map(([hour, count]) => ({ hour, count })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      // Create status data for pie chart (for students)
      const statusData = [
        { name: 'On Time', value: stats.onTimeRecords, color: '#10b981' },
        { name: 'Late', value: stats.lateRecords, color: '#ef4444' }
      ].filter(item => item.value > 0);

      return { personData, dailyData, timeData, statusData };
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return { personData: [], dailyData: [], timeData: [], statusData: [] };
    }
  }, [filteredRecords]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAttendanceData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">
            {currentUser?.role === 'admin' 
              ? 'Comprehensive attendance insights and trends'
              : 'Your personal attendance insights and trends'
            }
          </p>
        </div>
        <button
          onClick={loadAttendanceData}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Range</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: 'today', label: 'Today' },
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: 'custom', label: 'Custom Range' },
            { value: 'all', label: 'All Time' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {timeRange === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {filteredRecords.length > 0 ? (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {currentUser?.role === 'admin' ? 'Total Students' : 'Total Records'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentUser?.role === 'admin' ? stats.uniqueStudents : stats.totalRecords}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {currentUser?.role === 'admin' ? 'Total Records' : 'Days Present'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentUser?.role === 'admin' ? stats.totalRecords : stats.uniqueDays}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Late Arrivals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.lateRecords}</p>
                  <p className="text-xs text-gray-500">{stats.latePercentage}% of total</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {currentUser?.role === 'admin' ? 'Daily Average' : 'On Time'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentUser?.role === 'admin' ? stats.averageDaily : stats.onTimeRecords}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Person-wise Chart - Show for admin or if student has data */}
            {((currentUser?.role === 'admin' && chartData.personData.length > 1) || 
              (currentUser?.role === 'student' && chartData.personData.length > 0)) && (
              <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {currentUser?.role === 'admin' ? 'Student-wise Attendance' : 'My Attendance Overview'}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.personData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#f3f4f6', 
                          border: '1px solid #d1d5db',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="count">
                        {chartData.personData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {/* Status Pie Chart - Only for students */}
            {currentUser?.role === 'student' && chartData.statusData.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Status</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#f3f4f6', 
                          border: '1px solid #d1d5db',
                          borderRadius: '8px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {chartData.dailyData.length > 1 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {currentUser?.role === 'admin' ? 'Daily Attendance Trend' : 'My Daily Attendance Trend'}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#f3f4f6', 
                          border: '1px solid #d1d5db',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }} 
                        activeDot={{ r: 8, fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {chartData.timeData.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {currentUser?.role === 'admin' ? 'Check-in Times Distribution' : 'My Check-in Times'}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#f3f4f6', 
                          border: '1px solid #d1d5db',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="count">
                        {chartData.timeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600 mb-4">No attendance records found for the selected time period.</p>
          <p className="text-sm text-gray-500">
            {currentUser?.role === 'admin' 
              ? 'Students need to use the camera to record their attendance.'
              : 'Try selecting a different time range or use the camera to record your attendance.'
            }
          </p>
        </div>
      )}
    </div>
  );
};