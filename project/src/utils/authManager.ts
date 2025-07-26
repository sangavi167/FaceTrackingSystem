import { User } from '../types';

// Mock users database
const mockUsers: User[] = [
  {
    id: 'admin-1',
    username: 'admin',
    email: 'admin@company.com',
    fullName: 'System Administrator',
    role: 'admin',
    department: 'IT',
    position: 'System Admin',
    joinDate: '2024-01-01',
    employeeId: 'EMP001',
    isActive: true
  },
  {
    id: 'student-1',
    username: 'sangavi',
    email: 'sangavi@school.edu',
    fullName: 'Sangavi Kumar',
    role: 'student',
    department: 'Computer Science',
    position: 'Student',
    joinDate: '2024-02-15',
    employeeId: 'STU002',
    isActive: true
  },
  {
    id: 'student-2',
    username: 'yuvaraj',
    email: 'yuvaraj.student@school.edu',
    fullName: 'Yuvaraj Singh',
    role: 'student',
    department: 'Computer Science',
    position: 'Student',
    joinDate: '2024-02-20',
    employeeId: 'STU003',
    isActive: true
  },
  {
    id: 'teacher-1',
    username: 'dr.sharma',
    email: 'sharma@school.edu',
    fullName: 'Dr. Rajesh Sharma',
    role: 'teacher',
    department: 'Computer Science',
    position: 'Professor',
    joinDate: '2020-01-15',
    employeeId: 'TCH001',
    isActive: true
  },
  {
    id: 'teacher-2',
    username: 'prof.patel',
    email: 'patel@school.edu',
    fullName: 'Prof. Priya Patel',
    role: 'teacher',
    department: 'Computer Science',
    position: 'Associate Professor',
    joinDate: '2021-03-10',
    employeeId: 'TCH002',
    isActive: true
  },
  {
    id: 'teacher-3',
    username: 'dr.kumar',
    email: 'kumar@school.edu',
    fullName: 'Dr. Amit Kumar',
    role: 'teacher',
    department: 'Mathematics',
    position: 'Professor',
    joinDate: '2019-08-20',
    employeeId: 'TCH003',
    isActive: true
  },
  {
    id: 'teacher-4',
    username: 'ms.singh',
    email: 'singh@school.edu',
    fullName: 'Ms. Neha Singh',
    role: 'teacher',
    department: 'Physics',
    position: 'Assistant Professor',
    joinDate: '2022-01-05',
    employeeId: 'TCH004',
    isActive: true
  }
];

export class AuthManager {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  private readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

  // Login with username and password
  login(username: string, password: string): { success: boolean; user?: User; error?: string } {
    // Demo credentials
    const demoCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'sangavi', password: 'sangavi123' },
      { username: 'yuvaraj', password: 'yuvaraj123' },
      { username: 'dr.sharma', password: 'sharma123' },
      { username: 'prof.patel', password: 'patel123' },
      { username: 'dr.kumar', password: 'kumar123' },
      { username: 'ms.singh', password: 'singh123' }
    ];

    const validCredential = demoCredentials.find(
      cred => cred.username === username && cred.password === password
    );

    if (!validCredential) {
      return { success: false, error: 'Invalid username or password' };
    }

    const user = mockUsers.find(u => u.username === username);
    if (!user || !user.isActive) {
      return { success: false, error: 'User not found or inactive' };
    }

    // Create session token
    const token = btoa(`${username}:${Date.now()}`);
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    return { success: true, user };
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const user = this.getCurrentUser();
    
    if (!token || !user) return false;

    try {
      const [, timestamp] = atob(token).split(':');
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      
      return (now - tokenTime) < this.SESSION_DURATION;
    } catch {
      return false;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // Check if current user is admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Get all users (admin only)
  getAllUsers(): User[] {
    if (!this.isAdmin()) return [];
    return mockUsers.filter(user => user.isActive);
  }

  // Get user by ID
  getUserById(id: string): User | null {
    return mockUsers.find(user => user.id === id) || null;
  }

  // Get all teachers (for student requests)
  getAllTeachers(): User[] {
    return mockUsers.filter(user => user.role === 'teacher' && user.isActive);
  }

  // Update user (admin only)
  updateUser(id: string, updates: Partial<User>): boolean {
    if (!this.isAdmin()) return false;
    
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
    return true;
  }
}

export const authManager = new AuthManager();