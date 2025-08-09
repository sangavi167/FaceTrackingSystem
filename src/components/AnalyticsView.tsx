@@ .. @@
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
 import { format, subDays, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
 import { getAttendanceRecords } from '../data/mockData';
 import { AttendanceRecord } from '../types';
 import { authManager } from '../utils/authManager';

-const VIBRANT_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];
+const VIBRANT_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b', '#ef4444'];

 export const AnalyticsView: React.FC = () => {
   const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'custom' | 'all'>('all');
   const [customStartDate, setCustomStartDate] = useState<string>('');
   const [customEndDate, setCustomEndDate] = useState<string>('');
   const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
   const [lastRefresh, setLastRefresh] = useState(new Date());

   const currentUser = authManager.getCurrentUser();

@@ .. @@
             <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData.personData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="name" />
                   <YAxis />
                   <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />
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
         
         {chartData.dailyData.length > 1 && (
           <div className="bg-white rounded-xl shadow-lg p-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentUser?.role === 'admin' ? 'Daily Attendance Trend' : 'My Daily Attendance Trend'}</h3>
             <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData.dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="date" />
                   <YAxis />
                   <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />
-                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }} activeDot={{ r: 8, fill: '#10b981' }}/>
+                  <Line 
+                    type="monotone" 
+                    dataKey="count" 
+                    stroke="#10b981" 
+                    strokeWidth={3} 
+                    dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }} 
+                    activeDot={{ r: 8, fill: '#10b981' }}
+                  />
                 </LineChart>
               </ResponsiveContainer>
             </div>
           </div>
         )}

         {chartData.timeData.length > 0 && (
           <div className="bg-white rounded-xl shadow-lg p-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentUser?.role === 'admin' ? 'Check-in Times Distribution' : 'My Check-in Times'}</h3>
             <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData.timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="hour" />
                   <YAxis allowDecimals={false} />
                   <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }} />
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