import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Mail, MessageSquare, Filter, Calendar, User, Clock, RefreshCw } from 'lucide-react';
import { AttendanceRecord } from '../types';
import { getAttendanceRecords } from '../data/mockData';
import { exportPersonAttendancePDF, exportAllAttendancePDF } from '../utils/pdfExport';
import { NotificationModal } from './NotificationModal';

export const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'late'>('all');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationPerson, setNotificationPerson] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Load attendance records
  useEffect(() => {
    const loadRecords = () => {
      const records = getAttendanceRecords();
      setAttendanceRecords(records);
      setLastRefresh(new Date());
    };

    loadRecords();
    
    // Auto-refresh every 5 seconds to catch new face recognitions
    const interval = setInterval(loadRecords, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    const records = getAttendanceRecords();
    setAttendanceRecords(records);
    setLastRefresh(new Date());
  };

  // Filter and search logic
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || record.isLate;
      const matchesPerson = !selectedPerson || record.name === selectedPerson;
      
      return matchesSearch && matchesFilter && matchesPerson;
    });
  }, [searchTerm, filterStatus, selectedPerson, attendanceRecords]);

  // Get unique person names
  const uniquePersons = useMemo(() => {
    return Array.from(new Set(attendanceRecords.map(record => record.name)));
  }, [attendanceRecords]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const late = filteredRecords.filter(r => r.isLate).length;
    
    return { total, late };
  }, [filteredRecords]);

  const handleExportPerson = (personName: string) => {
    const personRecords = attendanceRecords.filter(record => record.name === personName);
    exportPersonAttendancePDF(personRecords, personName);
  };

  const handleSendNotification = (personName: string) => {
    setNotificationPerson(personName);
    setIsNotificationModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Late Arrivals Dashboard</h2>
            <p className="text-gray-600">Monitor late arrivals (after 8:30 AM)</p>
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
            <button
              onClick={() => exportAllAttendancePDF(filteredRecords)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Late Arrivals</p>
              <p className="text-2xl font-bold text-red-600">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique People</p>
              <p className="text-2xl font-bold text-blue-600">{uniquePersons.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Persons</option>
            {uniquePersons.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>

          <div className="flex items-center justify-center px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <Clock className="h-4 w-4 mr-2 text-red-600" />
            <span className="text-red-700 font-medium">Late Arrivals Only</span>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record, index) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        record.status === 'checked-out' ? 'bg-blue-100' :
                        record.isLate ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        <span className={`font-medium text-sm ${
                          record.status === 'checked-out' ? 'text-blue-600' :
                          record.isLate ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {record.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {record.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkInTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkOutTime || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.workingHours ? `${record.workingHours}h` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'checked-out' ? 'bg-blue-100 text-blue-800' :
                      record.status === 'late' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {record.status === 'checked-out' ? 'Checked Out' :
                       record.status === 'late' ? 'Late Arrival' :
                       'Checked In'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleExportPerson(record.name)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Export PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleSendNotification(record.name)}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title="Send Notification"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No attendance records found</p>
            <p className="text-gray-400 text-sm">Start using the camera to record check-ins and check-outs</p>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        personName={notificationPerson}
        attendanceRecords={attendanceRecords.filter(r => r.name === notificationPerson)}
      />
    </div>
  );
};