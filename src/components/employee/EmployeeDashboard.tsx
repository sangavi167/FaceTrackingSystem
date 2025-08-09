@@ .. @@
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, AlertTriangle, TrendingUp, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authManager } from '../../utils/authManager';
import { hrManager } from '../../utils/hrManager';
import { getAttendanceRecords } from '../../data/mockData';
-import { LeaveApplication, ODApplication, Incident, AttendanceRecord } from '../../types';
+import { LeaveApplication, ODApplication, Incident, AttendanceRecord, User } from '../../types';

export const EmployeeDashboard: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [odApplications, setODApplications] = useState<ODApplication[]>([]);
+  const [pendingLeaveApplications, setPendingLeaveApplications] = useState<LeaveApplication[]>([]);
+  const [pendingODApplications, setPendingODApplications] = useState<ODApplication[]>([]);
   const [incidents, setIncidents] = useState<Incident[]>([]);
   const [leaveBalance, setLeaveBalance] = useState({ annual: 0, sick: 0, casual: 0 });
   const [isLoading, setIsLoading] = useState(true);

   const currentUser = authManager.getCurrentUser();

   useEffect(() => {
     if (currentUser) {
       loadEmployeeData();
     }
   }, [currentUser]);

   const loadEmployeeData = async () => {
     setIsLoading(true);
     try {
       // Load attendance records
       const allAttendance = getAttendanceRecords();
       const userAttendance = allAttendance.filter(record => 
         record.name.toLowerCase() === currentUser?.username.toLowerCase()
       );
       setAttendanceRecords(userAttendance);

       // Load leave applications
       const leaves = hrManager.getLeaveApplications(currentUser?.id);
       setLeaveApplications(leaves);

       // Load OD applications
       const ods = hrManager.getODApplications(currentUser?.id);
       setODApplications(ods);

+      // For teachers, load pending applications from students
+      if (currentUser?.role === 'teacher') {
+        // Get all leave applications where this teacher is the requested approver
+        const allLeaves = hrManager.getLeaveApplications();
+        const pendingLeaves = allLeaves.filter(app => 
+          app.requestedToTeacherId === currentUser.id && app.status === 'pending'
+        );
+        setPendingLeaveApplications(pendingLeaves);
+
+        // Get all OD applications where this teacher is the requested approver
+        const allODs = hrManager.getODApplications();
+        const pendingODs = allODs.filter(app => 
+          app.requestedToTeacherId === currentUser.id && app.status === 'pending'
+        );
+        setPendingODApplications(pendingODs);
+      }

       // Load incidents
       const userIncidents = hrManager.getIncidents(currentUser?.id);
       setIncidents(userIncidents);

       // Load leave balance
       const balance = hrManager.getLeaveBalance(currentUser?.id || '');
       setLeaveBalance(balance);
     } catch (error) {
       console.error('Error loading employee data:', error);
     } finally {
       setIsLoading(false);
     }
   };

   if (isLoading) {
     return (
       <div className="flex items-center justify-center min-h-screen">
         <div className="text-center">
           <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
           <p className="text-gray-600">Loading your dashboard...</p>
         </div>
       </div>
     );
   }

   const todayAttendance = attendanceRecords.find(record => 
     record.date === new Date().toISOString().split('T')[0]
   );

   const thisMonthAttendance = attendanceRecords.filter(record => {
     const recordMonth = record.date.substring(0, 7);
     const currentMonth = new Date().toISOString().substring(0, 7);
     return recordMonth === currentMonth;
   });

   const pendingLeaves = leaveApplications.filter(app => app.status === 'pending').length;
   const pendingODs = odApplications.filter(app => app.status === 'pending').length;
   const openIncidents = incidents.filter(incident => incident.status === 'open').length;

+  const isTeacher = currentUser?.role === 'teacher';

   return (
     <div className="max-w-7xl mx-auto p-6">
       {/* Welcome Header */}
       <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 mb-6 text-white">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-bold mb-2">Welcome back, {currentUser?.fullName}!</h1>
             <p className="text-blue-100">
               {currentUser?.position} • {currentUser?.department} Department
             </p>
             <p className="text-blue-200 text-sm mt-1">
               Employee ID: {currentUser?.employeeId}
             </p>
           </div>
           <div className="text-right">
-            <p className="text-blue-100 text-sm">Today's Status</p>
+            <p className="text-blue-100 text-sm">
+              {isTeacher ? 'Role' : 'Today\'s Status'}
+            </p>
             <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
-              todayAttendance 
+              isTeacher ? 'bg-purple-500 text-white' :
+              todayAttendance 
                 ? todayAttendance.status === 'checked-out' 
                   ? 'bg-green-500 text-white'
                   : todayAttendance.isLate 
                     ? 'bg-red-500 text-white'
                     : 'bg-blue-500 text-white'
                 : 'bg-gray-500 text-white'
             }`}>
-              {todayAttendance 
+              {isTeacher ? 'Teacher' :
+               todayAttendance 
                 ? todayAttendance.status === 'checked-out' 
                   ? 'Checked Out'
                   : todayAttendance.isLate 
                     ? 'Late Arrival'
                     : 'Present'
                 : 'Not Checked In'
               }
             </div>
           </div>
         </div>
       </div>

       {/* Quick Stats */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
         <div className="bg-white rounded-xl shadow-lg p-6">
           <div className="flex items-center justify-between">
             <div>
-              <p className="text-sm font-medium text-gray-600">This Month Attendance</p>
-              <p className="text-2xl font-bold text-blue-600">{thisMonthAttendance.length}</p>
-              <p className="text-xs text-gray-500">days present</p>
+              <p className="text-sm font-medium text-gray-600">
+                {isTeacher ? 'Pending Requests' : 'This Month Attendance'}
+              </p>
+              <p className="text-2xl font-bold text-blue-600">
+                {isTeacher ? pendingLeaveApplications.length + pendingODApplications.length : thisMonthAttendance.length}
+              </p>
+              <p className="text-xs text-gray-500">
+                {isTeacher ? 'requests to review' : 'days present'}
+              </p>
             </div>
             <div className="p-3 bg-blue-100 rounded-full">
-              <Calendar className="h-6 w-6 text-blue-600" />
+              {isTeacher ? <FileText className="h-6 w-6 text-blue-600" /> : <Calendar className="h-6 w-6 text-blue-600" />}
             </div>
           </div>
         </div>

         <div className="bg-white rounded-xl shadow-lg p-6">
           <div className="flex items-center justify-between">
             <div>
-              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
-              <p className="text-2xl font-bold text-orange-600">{pendingLeaves + pendingODs}</p>
-              <p className="text-xs text-gray-500">{pendingLeaves} leaves, {pendingODs} ODs</p>
+              <p className="text-sm font-medium text-gray-600">
+                {isTeacher ? 'Leave Requests' : 'Pending Requests'}
+              </p>
+              <p className="text-2xl font-bold text-orange-600">
+                {isTeacher ? pendingLeaveApplications.length : pendingLeaves + pendingODs}
+              </p>
+              <p className="text-xs text-gray-500">
+                {isTeacher ? 'pending approval' : `${pendingLeaves} leaves, ${pendingODs} ODs`}
+              </p>
             </div>
             <div className="p-3 bg-orange-100 rounded-full">
               <Clock className="h-6 w-6 text-orange-600" />
             </div>
           </div>
         </div>

         <div className="bg-white rounded-xl shadow-lg p-6">
           <div className="flex items-center justify-between">
             <div>
-              <p className="text-sm font-medium text-gray-600">Leave Balance</p>
-              <p className="text-2xl font-bold text-green-600">{leaveBalance.annual + leaveBalance.sick + leaveBalance.casual}</p>
-              <p className="text-xs text-gray-500">days remaining</p>
+              <p className="text-sm font-medium text-gray-600">
+                {isTeacher ? 'OD Requests' : 'Leave Balance'}
+              </p>
+              <p className="text-2xl font-bold text-green-600">
+                {isTeacher ? pendingODApplications.length : leaveBalance.annual + leaveBalance.sick + leaveBalance.casual}
+              </p>
+              <p className="text-xs text-gray-500">
+                {isTeacher ? 'pending approval' : 'days remaining'}
+              </p>
             </div>
             <div className="p-3 bg-green-100 rounded-full">
-              <FileText className="h-6 w-6 text-green-600" />
+              {isTeacher ? <Calendar className="h-6 w-6 text-green-600" /> : <FileText className="h-6 w-6 text-green-600" />}
             </div>
           </div>
         </div>

         <div className="bg-white rounded-xl shadow-lg p-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">Open Incidents</p>
               <p className="text-2xl font-bold text-red-600">{openIncidents}</p>
               <p className="text-xs text-gray-500">require attention</p>
             </div>
             <div className="p-3 bg-red-100 rounded-full">
               <AlertTriangle className="h-6 w-6 text-red-600" />
             </div>
           </div>
         </div>
       </div>

       {/* Today's Attendance - Only for students */}
-      {todayAttendance && (
+      {!isTeacher && todayAttendance && (
         <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="flex items-center">
               <div className="p-2 bg-green-100 rounded-lg mr-3">
                 <Clock className="h-5 w-5 text-green-600" />
               </div>
               <div>
                 <p className="text-sm text-gray-600">Check In</p>
                 <p className="font-medium">{todayAttendance.checkInTime}</p>
               </div>
             </div>
             
             {todayAttendance.checkOutTime && (
               <div className="flex items-center">
                 <div className="p-2 bg-blue-100 rounded-lg mr-3">
                   <Clock className="h-5 w-5 text-blue-600" />
                 </div>
                 <div>
                   <p className="text-sm text-gray-600">Check Out</p>
                   <p className="font-medium">{todayAttendance.checkOutTime}</p>
                 </div>
               </div>
             )}
             
             {todayAttendance.workingHours && (
               <div className="flex items-center">
                 <div className="p-2 bg-purple-100 rounded-lg mr-3">
                   <TrendingUp className="h-5 w-5 text-purple-600" />
                 </div>
                 <div>
                   <p className="text-sm text-gray-600">Working Hours</p>
                   <p className="font-medium">{todayAttendance.workingHours}h</p>
                 </div>
               </div>
             )}
           </div>
         </div>
       )}

       {/* Leave Balance Details - Only for students */}
-      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
+      {!isTeacher && (
+        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
         <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="text-center p-4 bg-blue-50 rounded-lg">
             <p className="text-2xl font-bold text-blue-600">{leaveBalance.annual}</p>
             <p className="text-sm text-gray-600">Annual Leave</p>
           </div>
           <div className="text-center p-4 bg-green-50 rounded-lg">
             <p className="text-2xl font-bold text-green-600">{leaveBalance.sick}</p>
             <p className="text-sm text-gray-600">Sick Leave</p>
           </div>
           <div className="text-center p-4 bg-purple-50 rounded-lg">
             <p className="text-2xl font-bold text-purple-600">{leaveBalance.casual}</p>
             <p className="text-sm text-gray-600">Casual Leave</p>
           </div>
         </div>
-      </div>
+        </div>
+      )}

       {/* Recent Applications */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
-        {/* Recent Leave Applications */}
+        {/* Recent Leave Applications or Pending Leave Requests for Teachers */}
         <div className="bg-white rounded-xl shadow-lg p-6">
-          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leave Applications</h3>
+          <h3 className="text-lg font-semibold text-gray-900 mb-4">
+            {isTeacher ? 'Pending Leave Applications' : 'Recent Leave Applications'}
+          </h3>
           <div className="space-y-3">
-            {leaveApplications.slice(0, 3).map((leave) => (
+            {(isTeacher ? pendingLeaveApplications : leaveApplications).slice(0, 3).map((leave) => (
               <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                 <div>
                   <p className="font-medium text-gray-900">
                     {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
                   </p>
+                  {isTeacher && (
+                    <p className="text-sm text-gray-600 font-medium">
+                      {leave.employeeName}
+                    </p>
+                  )}
                   <p className="text-sm text-gray-600">
                     {leave.startDate} to {leave.endDate} ({leave.totalDays} days)
                   </p>
                 </div>
                 <div className="flex items-center">
                   {leave.status === 'pending' && (
                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                       <Clock className="h-3 w-3 mr-1" />
                       Pending
                     </span>
                   )}
                   {leave.status === 'approved' && (
                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       <CheckCircle className="h-3 w-3 mr-1" />
                       Approved
                     </span>
                   )}
                   {leave.status === 'rejected' && (
                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                       <XCircle className="h-3 w-3 mr-1" />
                       Rejected
                     </span>
                   )}
                 </div>
               </div>
             ))}
-            {leaveApplications.length === 0 && (
-              <p className="text-gray-500 text-center py-4">No leave applications yet</p>
+            {(isTeacher ? pendingLeaveApplications : leaveApplications).length === 0 && (
+              <p className="text-gray-500 text-center py-4">
+                {isTeacher ? 'No pending leave applications' : 'No leave applications yet'}
+              </p>
             )}
           </div>
         </div>

-        {/* Recent OD Applications */}
+        {/* Recent OD Applications or Pending OD Requests for Teachers */}
         <div className="bg-white rounded-xl shadow-lg p-6">
-          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent OD Applications</h3>
+          <h3 className="text-lg font-semibold text-gray-900 mb-4">
+            {isTeacher ? 'Pending OD Applications' : 'Recent OD Applications'}
+          </h3>
           <div className="space-y-3">
-            {odApplications.slice(0, 3).map((od) => (
+            {(isTeacher ? pendingODApplications : odApplications).slice(0, 3).map((od) => (
               <div key={od.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                 <div>
                   <p className="font-medium text-gray-900">{od.purpose}</p>
+                  {isTeacher && (
+                    <p className="text-sm text-gray-600 font-medium">
+                      {od.employeeName}
+                    </p>
+                  )}
                   <p className="text-sm text-gray-600">
                     {od.date} • {od.startTime} - {od.endTime}
                   </p>
                   <p className="text-xs text-gray-500">{od.location}</p>
                 </div>
                 <div className="flex items-center">
                   {od.status === 'pending' && (
                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                       <Clock className="h-3 w-3 mr-1" />
                       Pending
                     </span>
                   )}
                   {od.status === 'approved' && (
                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       <CheckCircle className="h-3 w-3 mr-1" />
                       Approved
                     </span>
                   )}
                   {od.status === 'rejected' && (
                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                       <XCircle className="h-3 w-3 mr-1" />
                       Rejected
                     </span>
                   )}
                 </div>
               </div>
             ))}
-            {odApplications.length === 0 && (
-              <p className="text-gray-500 text-center py-4">No OD applications yet</p>
+            {(isTeacher ? pendingODApplications : odApplications).length === 0 && (
+              <p className="text-gray-500 text-center py-4">
+                {isTeacher ? 'No pending OD applications' : 'No OD applications yet'}
+              </p>
             )}
           </div>
         </div>
       </div>
     </div>
   );
 };