import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, Users, AlertTriangle, RefreshCw, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { format, subDays, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { getAttendanceRecords } from '../data/mockData';
import { AttendanceRecord } from '../types';
import { authManager } from '../utils/authManager';

// FIXED: Added a color palette for vibrant charts
const VIBRANT_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'custom' | 'all'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const currentUser = authManager.getCurrentUser();

  // Load attendance records
  useEffect(() => {
    const loadRecords = () => {
      try {
        const allRecords = getAttendanceRecords();
        let userRecords: AttendanceRecord[] = [];
        
        if (currentUser?.role === 'admin') {
          userRecords = allRecords;
        } else if (currentUser?.role === 'student') {
          userRecords = allRecords.filter(record => {
            if (!record || !record.name || !currentUser?.username) {
              return false;
            }
            const recordName = record.name.toLowerCase().trim();
            const userName = currentUser.username.toLowerCase().trim();
            return recordName === userName;
          });
        } else {
          userRecords = [];
        }
        
        setAttendanceRecords(userRecords);
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Error loading attendance records:', error);
        setAttendanceRecords([]);
      }
    };

    loadRecords();
    const interval = setInterval(loadRecords, 5000); // Note: refreshing every 5s can be intensive
    return () => clearInterval(interval);
  }, [currentUser]);

  // Set default custom dates when switching to custom range
  useEffect(() => {
    if (timeRange === 'custom' && !customStartDate && !customEndDate) {
      const today = new Date();
      const weekAgo = subDays(today, 7);
      setCustomStartDate(format(weekAgo, 'yyyy-MM-dd'));
      setCustomEndDate(format(today, 'yyyy-MM-dd'));
    }
  }, [timeRange, customStartDate, customEndDate]);

  // Filter records by time range
  const filteredRecords = useMemo(() => {
    try {
      if (!attendanceRecords || attendanceRecords.length === 0) {
        return [];
      }

      if (timeRange === 'today') {
        const today = format(new Date(), 'yyyy-MM-dd');
        return attendanceRecords.filter(record => record && record.date === today);
      }
      
      if (timeRange === 'all') return attendanceRecords;
      
      let startDate: Date;
      let endDate: Date = new Date();

      if (timeRange === 'custom') {
        if (!customStartDate || !customEndDate) return attendanceRecords;
        startDate = startOfDay(parseISO(customStartDate));
        endDate = endOfDay(parseISO(customEndDate));
      } else {
        const days = timeRange === '7d' ? 7 : 30;
        startDate = startOfDay(subDays(new Date(), days));
        endDate = endOfDay(new Date());
      }
      
      return attendanceRecords.filter(record => {
        if (!record || !record.date) return false;
        try {
          const recordDate = parseISO(record.date);
          // Check if recordDate is within the [startDate, endDate] interval
          return !isBefore(recordDate, startDate) && !isAfter(recordDate, endDate);
        } catch (error) {
          console.error('Error parsing date:', record.date, error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error filtering records:', error);
      return [];
    }
  }, [attendanceRecords, timeRange, customStartDate, customEndDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    try {
      const totalRecords = filteredRecords.length;
      const lateRecords = filteredRecords.filter(r => r && r.isLate).length;
      const onTimeRecords = totalRecords - lateRecords;
      
      const personCounts = filteredRecords.reduce((acc, record) => {
        if (record && record.name) {
          acc[record.name] = (acc[record.name] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const uniquePeople = Object.keys(personCounts).length;
      
      const mostFrequentPerson = Object.entries(personCounts)
        .sort(([,a], [,b]) => b - a)[0];

      // Calculate trend (compare with previous period)
      let trend = 0;
      let trendPercentage = 0;
      if (timeRange !== 'all' && timeRange !== 'custom') {
        const currentPeriodDays = timeRange === 'today' ? 1 : (timeRange === '7d' ? 7 : 30);
        const previousPeriodStart = subDays(new Date(), currentPeriodDays * 2);
        const previousPeriodEnd = subDays(new Date(), currentPeriodDays);

        const previousRecords = attendanceRecords.filter(record => {
            if (!record?.date) return false;
            const recordDate = parseISO(record.date);
            return isAfter(recordDate, previousPeriodStart) && isBefore(recordDate, previousPeriodEnd);
        });

        const previousCount = previousRecords.length;
        trend = totalRecords - previousCount;
        trendPercentage = previousCount > 0 ? (trend / previousCount) * 100 : (totalRecords > 0 ? 100 : 0);
      }

      return {
        totalRecords,
        lateRecords,
        onTimeRecords,
        uniquePeople,
        mostFrequentPerson: mostFrequentPerson ? {
          name: mostFrequentPerson[0],
          count: mostFrequentPerson[1]
        } : null,
        trend,
        trendPercentage
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalRecords: 0,
        lateRecords: 0,
        onTimeRecords: 0,
        uniquePeople: 0,
        mostFrequentPerson: null,
        trend: 0,
        trendPercentage: 0
      };
    }
  }, [filteredRecords, attendanceRecords, timeRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    try {
      const personData = Object.entries(
        filteredRecords.reduce((acc, record) => {
          if (record && record.name) {
            acc[record.name] = (acc[record.name] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, count]) => ({ name, count }))
       .sort((a, b) => b.count - a.count);

      const dailyData = Object.entries(
        filteredRecords.reduce((acc, record) => {
          if (record && record.date) {
            acc[record.date] = (acc[record.date] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      ).map(([date, count]) => ({
          date: format(parseISO(date), 'MMM dd'),
          count
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const hourlyData = filteredRecords.reduce((acc, record) => {
        if (record && record.checkInTime) {
          try {
            const timeParts = record.checkInTime.split(':');
            if (timeParts.length >= 2) {
              const hour = parseInt(timeParts[0]);
              if (!isNaN(hour)) {
                // FIXED: Used backticks for template literal
                const hourLabel = `${hour}:00`;
                acc[hourLabel] = (acc[hourLabel] || 0) + 1;
              }
            }
          } catch (error) {
            console.error('Error parsing time:', record.checkInTime, error);
          }
        }
        return acc;
      }, {} as Record<string, number>);

      const timeData = Object.entries(hourlyData)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      return { personData, dailyData, timeData };
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return { personData: [], dailyData: [], timeData: [] };
    }
  }, [filteredRecords]);

  const handleRefresh = () => {
    // This function is largely redundant due to the useEffect interval, but kept for manual refresh
    try {
      const records = getAttendanceRecords();
      setAttendanceRecords(records);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentUser?.role === 'admin' ? 'All Students Attendance Analytics' : 'My Attendance Analytics'}
            </h2>
            <p className="text-gray-600">
              {/* FIXED: Used template literal */}
              {currentUser?.role === 'admin' 
                ? 'Complete attendance analysis for all students' 
                : `Personal attendance analysis for ${currentUser?.fullName || 'Student'}`
              } • 
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Date Range Filter</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Time Range Buttons */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              {(['today', '7d', '30d', 'custom', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {range === 'today' ? 'Today' : 
                   range === '7d' ? 'Last 7 Days' : 
                   range === '30d' ? 'Last 30 Days' : 
                   range === 'custom' ? 'Custom Range' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          {timeRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>

        {/* Date Range Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Showing data for:</strong> {/* FIXED: Used template literals */}
            {
              timeRange === 'today' ? `Today (${format(new Date(), 'MMM dd, yyyy')})` :
              timeRange === 'all' ? 'All time' :
              timeRange === '7d' ? 'Last 7 days' :
              timeRange === '30d' ? 'Last 30 days' :
              timeRange === 'custom' && customStartDate && customEndDate ? 
                `${format(parseISO(customStartDate), 'MMM dd, yyyy')} to ${format(parseISO(customEndDate), 'MMM dd, yyyy')}` :
                'Custom range (select dates)'
            } • {filteredRecords.length} records found
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {currentUser?.role === 'admin' ? 'Total Records' : 'My Total Records'}
              </p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalRecords}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Trend vs {timeRange === 'today' ? 'Yesterday' : 'Prev. Period'}
              </p>
              {/* FIXED: Used template literals for dynamic class names */}
              <p className={`text-3xl font-bold ${stats.trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.trend > 0 ? '+' : ''}{stats.trend}
              </p>
              <p className={`text-sm ${stats.trendPercentage >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.trendPercentage >= 0 ? '↗' : '↘'} {Math.abs(stats.trendPercentage).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Late Arrivals</p>
              <p className="text-3xl font-bold text-red-600">{stats.lateRecords}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Time Arrivals</p>
              <p className="text-3xl font-bold text-green-600">{stats.onTimeRecords}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Person-wise Chart (Admin Only) */}
        {currentUser?.role === 'admin' && chartData.personData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student-wise Attendance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.personData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />
                  <Bar dataKey="count">
                    {/* FIXED: Applied vibrant color palette */}
                    {chartData.personData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Daily Trend Chart */}
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
                  <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />
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

        {/* Time Distribution Chart */}
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
                  <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />
                  <Bar dataKey="count">
                    {/* FIXED: Applied vibrant color palette */}
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
      
      {/* Redundant Weekly chart removed as it was identical to the line chart's data */}

      {/* No Data Message */}
      {filteredRecords.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600 mb-4">
            No attendance records found for the selected time period.
          </p>
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
