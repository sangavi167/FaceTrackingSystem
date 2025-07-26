import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, Users, AlertTriangle, RefreshCw, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { getAttendanceRecords } from '../data/mockData';
import { AttendanceRecord } from '../types';

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'custom' | 'all'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Load attendance records
  useEffect(() => {
    const loadRecords = () => {
      const records = getAttendanceRecords();
      setAttendanceRecords(records);
      setLastRefresh(new Date());
      console.log('📊 Analytics loaded records:', records.length);
    };

    loadRecords();
    const interval = setInterval(loadRecords, 5000);
    return () => clearInterval(interval);
  }, []);

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
    if (timeRange === 'today') {
      const today = format(new Date(), 'yyyy-MM-dd');
      return attendanceRecords.filter(record => record.date === today);
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
      startDate = subDays(new Date(), days);
    }
    
    return attendanceRecords.filter(record => {
      const recordDate = parseISO(record.date);
      return isAfter(recordDate, startDate) && isBefore(recordDate, endDate);
    });
  }, [attendanceRecords, timeRange, customStartDate, customEndDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalLate = filteredRecords.length; // All records are late arrivals
    
    // Group by person
    const personCounts = filteredRecords.reduce((acc, record) => {
      acc[record.name] = (acc[record.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniquePeople = Object.keys(personCounts).length;
    
    // Find most frequent late person
    const mostFrequentPerson = Object.entries(personCounts)
      .sort(([,a], [,b]) => b - a)[0];

    // Calculate trend (compare with previous period)
    const previousPeriodDays = timeRange === 'today' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 60;
    const previousCutoff = subDays(new Date(), previousPeriodDays * 2);
    const currentCutoff = timeRange === 'today' ? startOfDay(new Date()) : subDays(new Date(), previousPeriodDays);
    
    const previousRecords = attendanceRecords.filter(record => {
      const recordDate = parseISO(record.date);
      if (timeRange === 'today') {
        // Compare with yesterday
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        return record.date === yesterday;
      }
      return isAfter(recordDate, previousCutoff) && isBefore(recordDate, currentCutoff);
    });

    const trend = totalLate - previousRecords.length;
    const trendPercentage = previousRecords.length > 0 
      ? ((trend / previousRecords.length) * 100) 
      : totalLate > 0 ? 100 : 0;

    console.log('📈 Analytics stats:', {
      totalLate,
      uniquePeople,
      mostFrequentPerson,
      trend,
      trendPercentage,
      personCounts
    });

    return {
      totalLate,
      uniquePeople,
      mostFrequentPerson: mostFrequentPerson ? {
        name: mostFrequentPerson[0],
        count: mostFrequentPerson[1]
      } : null,
      trend,
      trendPercentage
    };
  }, [filteredRecords, attendanceRecords, timeRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    // Group by person for bar chart
    const personData = Object.entries(
      filteredRecords.reduce((acc, record) => {
        acc[record.name] = (acc[record.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, count]) => ({ name, count }))
     .sort((a, b) => b.count - a.count);

    // Group by date for line chart
    const dailyData = Object.entries(
      filteredRecords.reduce((acc, record) => {
        acc[record.date] = (acc[record.date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([date, count]) => ({ 
      date: format(parseISO(date), 'MMM dd'), 
      count 
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Group by hour for time analysis
    const hourlyData = filteredRecords.reduce((acc, record) => {
      const hour = parseInt(record.checkInTime.split(':')[0]);
      const hourLabel = `${hour}:00`;
      acc[hourLabel] = (acc[hourLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const timeData = Object.entries(hourlyData)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    console.log('📊 Chart data prepared:', { personData, dailyData, timeData });

    return { personData, dailyData, timeData };
  }, [filteredRecords]);

  const handleRefresh = () => {
    const records = getAttendanceRecords();
    setAttendanceRecords(records);
    setLastRefresh(new Date());
  };

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Late Arrivals Analytics</h2>
            <p className="text-gray-600">Comprehensive analysis of attendance patterns</p>
            <p className="text-sm text-gray-500 mt-1">
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
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-600 mr-2" />
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
            <strong>Showing data for:</strong> {
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
              <p className="text-sm font-medium text-gray-600">Total Late Arrivals</p>
              <p className="text-3xl font-bold text-red-600">{stats.totalLate}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Trend vs {timeRange === 'today' ? 'Yesterday' : 'Previous Period'}
              </p>
              <p className={`text-3xl font-bold ${stats.trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.trend >= 0 ? '+' : ''}{stats.trend}
              </p>
              <p className={`text-sm ${stats.trendPercentage >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.trendPercentage >= 0 ? '↗' : '↘'} {Math.abs(stats.trendPercentage).toFixed(1)}%
                {timeRange === 'today' && ' vs yesterday'}
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
              <p className="text-sm font-medium text-gray-600">People with Late Arrivals</p>
              <p className="text-3xl font-bold text-blue-600">{stats.uniquePeople}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Most Frequent Late</p>
              <p className="text-xl font-bold text-purple-600">
                {stats.mostFrequentPerson ? stats.mostFrequentPerson.name : 'None'}
              </p>
              {stats.mostFrequentPerson && (
                <p className="text-sm text-gray-500">
                  {stats.mostFrequentPerson.count} times
                </p>
              )}
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Late Arrivals Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Distribution Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Late Arrival Times</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Person Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Late Arrivals by Person */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Late Arrivals by Person</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.personData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Late Arrivals by Day of Week */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Late Arrivals by Day</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* No Data Message */}
      {filteredRecords.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600 mb-4">
            No late arrivals found for the selected time period.
          </p>
          <p className="text-sm text-gray-500">
            Try selecting a different time range or check if the face recognition system is logging data.
          </p>
        </div>
      )}
    </div>
  );
};