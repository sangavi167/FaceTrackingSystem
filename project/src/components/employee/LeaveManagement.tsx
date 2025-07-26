import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import { authManager } from '../../utils/authManager';
import { hrManager } from '../../utils/hrManager';
import { LeaveApplication, User } from '../../types';

export const LeaveManagement: React.FC = () => {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState({ annual: 0, sick: 0, casual: 0 });
  const [teachers, setTeachers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    leaveType: 'casual' as const,
    startDate: '',
    endDate: '',
    reason: '',
    requestedToTeacherId: ''
  });

  const currentUser = authManager.getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      loadLeaveData();
      loadTeachers();
    }
  }, [currentUser]);

  const loadLeaveData = () => {
    const leaves = hrManager.getLeaveApplications(currentUser?.id);
    setApplications(leaves);
    
    const balance = hrManager.getLeaveBalance(currentUser?.id || '');
    setLeaveBalance(balance);
  };

  const loadTeachers = () => {
    const allTeachers = authManager.getAllTeachers();
    setTeachers(allTeachers);
  };

  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    const totalDays = calculateDays(formData.startDate, formData.endDate);
    
    // Check leave balance
    const availableBalance = leaveBalance[formData.leaveType];
    if (totalDays > availableBalance) {
      alert(`Insufficient leave balance. You have ${availableBalance} days remaining for ${formData.leaveType} leave.`);
      return;
    }

    const selectedTeacher = teachers.find(t => t.id === formData.requestedToTeacherId);

    const application = hrManager.submitLeaveApplication({
      employeeId: currentUser.id,
      employeeName: currentUser.fullName,
      requestedToTeacherId: formData.requestedToTeacherId,
      requestedToTeacherName: selectedTeacher?.fullName,
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      totalDays,
      reason: formData.reason
    });

    setApplications(prev => [application, ...prev]);
    setShowForm(false);
    setFormData({
      leaveType: 'casual',
      startDate: '',
      endDate: '',
      reason: '',
      requestedToTeacherId: ''
    });
    
    // Reload balance
    loadLeaveData();
  };

  const totalDays = calculateDays(formData.startDate, formData.endDate);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-600">Apply for leave and track your applications</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Apply for Leave
        </button>
      </div>

      {/* Leave Balance */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{leaveBalance.annual}</p>
            <p className="text-sm text-gray-600">Annual Leave</p>
            <p className="text-xs text-gray-500">21 days allocated</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{leaveBalance.sick}</p>
            <p className="text-sm text-gray-600">Sick Leave</p>
            <p className="text-xs text-gray-500">12 days allocated</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{leaveBalance.casual}</p>
            <p className="text-sm text-gray-600">Casual Leave</p>
            <p className="text-xs text-gray-500">12 days allocated</p>
          </div>
        </div>
      </div>

      {/* Leave Application Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Apply for Leave</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="annual">Annual Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request to Teacher
                </label>
                <select
                  value={formData.requestedToTeacherId}
                  onChange={(e) => setFormData(prev => ({ ...prev, requestedToTeacherId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName} - {teacher.position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {totalDays > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    <strong>Total Days:</strong> {totalDays} days
                  </p>
                  <p className="text-blue-700 text-xs">
                    Available {formData.leaveType} leave: {leaveBalance[formData.leaveType]} days
                  </p>
                  {totalDays > leaveBalance[formData.leaveType] && (
                    <p className="text-red-600 text-xs mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Insufficient leave balance
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please provide reason for leave..."
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={totalDays > leaveBalance[formData.leaveType] || !formData.requestedToTeacherId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Leave Applications</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">
                        {application.leaveType.charAt(0).toUpperCase() + application.leaveType.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.requestedToTeacherName || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.startDate} to {application.endDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.totalDays} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {application.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </span>
                    )}
                    {application.status === 'approved' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </span>
                    )}
                    {application.status === 'rejected' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.appliedDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {application.reason}
                    {application.status === 'rejected' && application.reviewComments && (
                      <div className="mt-1 text-red-600 text-xs">
                        <strong>Rejection reason:</strong> {application.reviewComments}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {applications.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No leave applications yet</p>
              <p className="text-gray-400 text-sm">Click "Apply for Leave" to submit your first application</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};