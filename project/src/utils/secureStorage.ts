// Secure storage utilities for tamper-proof attendance logs

export interface SecureAttendanceRecord {
  id: string;
  name: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  timestamp: Date;
  checkOutTimestamp?: Date;
  isLate: boolean;
  status: 'checked-in' | 'checked-out' | 'late' | 'absent';
  authMethod: 'face';
  faceConfidence?: number;
  workingHours?: number;
  hash: string; // Tamper detection hash
  signature: string; // Digital signature
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  timestamp: Date;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

class SecureStorage {
  private readonly STORAGE_KEY = 'secure_attendance_records';
  private readonly AUDIT_KEY = 'audit_logs';
  private readonly SECRET_KEY = 'face_analysis_secret_2024'; // In production, use environment variable

  // Generate hash for tamper detection
  private generateHash(record: Omit<SecureAttendanceRecord, 'hash' | 'signature'>): string {
    const data = JSON.stringify(record) + this.SECRET_KEY;
    return btoa(data).slice(0, 32); // Simple hash - use crypto.subtle in production
  }

  // Generate digital signature
  private generateSignature(record: Omit<SecureAttendanceRecord, 'signature'>): string {
    const data = JSON.stringify(record) + this.SECRET_KEY;
    return btoa(data).slice(-32); // Simple signature - use proper crypto in production
  }

  // Verify record integrity
  private verifyRecord(record: SecureAttendanceRecord): boolean {
    const { hash, signature, ...recordData } = record;
    const expectedHash = this.generateHash(recordData);
    const expectedSignature = this.generateSignature({ ...recordData, hash: expectedHash });
    
    return hash === expectedHash && signature === expectedSignature;
  }

  // Add secure attendance record
  addCheckInRecord(
    name: string,
    authMethod: 'face',
    faceConfidence?: number
  ): SecureAttendanceRecord {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const checkInTime = now.toTimeString().split(' ')[0];
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 8 || (hours === 8 && minutes > 30);

    const recordData = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      date,
      checkInTime,
      timestamp: now,
      isLate,
      status: isLate ? 'late' as const : 'checked-in' as const,
      authMethod,
      faceConfidence
    };

    const hash = this.generateHash(recordData);
    const signature = this.generateSignature({ ...recordData, hash });

    const secureRecord: SecureAttendanceRecord = {
      ...recordData,
      hash,
      signature
    };

    // Store in localStorage (in production, use encrypted database)
    const records = this.getAttendanceRecords();
    records.unshift(secureRecord);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));

    // Log the action
    this.addAuditLog('CHECK_IN_RECORDED', 'system', {
      recordId: secureRecord.id,
      name,
      authMethod,
      isLate
    });

    console.log('🔒 Secure check-in record added:', secureRecord);
    return secureRecord;
  }

  // Add check-out record
  addCheckOutRecord(
    name: string,
    authMethod: 'face',
    faceConfidence?: number
  ): SecureAttendanceRecord | null {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const checkOutTime = now.toTimeString().split(' ')[0];

    // Find today's check-in record for this person
    const records = this.getAttendanceRecords();
    const todayCheckIn = records.find(record => 
      record.name === name && 
      record.date === date && 
      record.status !== 'checked-out'
    );

    if (!todayCheckIn) {
      console.warn(`⚠️ No check-in record found for ${name} today`);
      return null;
    }

    // Calculate working hours
    const checkInTime = new Date(`${date}T${todayCheckIn.checkInTime}`);
    const checkOutTimestamp = now;
    const workingHours = (checkOutTimestamp.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // Update the existing record with check-out information
    const updatedRecord: SecureAttendanceRecord = {
      ...todayCheckIn,
      checkOutTime,
      checkOutTimestamp,
      status: 'checked-out' as const,
      workingHours: Math.round(workingHours * 100) / 100 // Round to 2 decimal places
    };

    // Regenerate hash and signature for updated record
    const { hash, signature, ...recordData } = updatedRecord;
    const newHash = this.generateHash(recordData);
    const newSignature = this.generateSignature({ ...recordData, hash: newHash });
    
    updatedRecord.hash = newHash;
    updatedRecord.signature = newSignature;

    // Update in storage
    const updatedRecords = records.map(record => 
      record.id === todayCheckIn.id ? updatedRecord : record
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedRecords));

    // Log the action
    this.addAuditLog('CHECK_OUT_RECORDED', 'system', {
      recordId: updatedRecord.id,
      name,
      authMethod,
      workingHours: updatedRecord.workingHours
    });

    console.log('🔒 Secure check-out record added:', updatedRecord);
    return updatedRecord;
  }
  // Get all attendance records with integrity verification
  getAttendanceRecords(): SecureAttendanceRecord[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const records: SecureAttendanceRecord[] = JSON.parse(stored);
      
      // Verify integrity of all records
      const verifiedRecords = records.filter(record => {
        const isValid = this.verifyRecord(record);
        if (!isValid) {
          console.warn('🚨 Tampered record detected:', record.id);
          this.addAuditLog('TAMPER_DETECTED', 'system', {
            recordId: record.id,
            name: record.name
          });
        }
        return isValid;
      });

      return verifiedRecords;
    } catch (error) {
      console.error('Error loading attendance records:', error);
      return [];
    }
  }

  // Add audit log entry
  addAuditLog(action: string, userId: string, details: any): void {
    const auditEntry: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      userId,
      timestamp: new Date(),
      details,
      ipAddress: 'localhost', // In production, get real IP
      userAgent: navigator.userAgent
    };

    const logs = this.getAuditLogs();
    logs.unshift(auditEntry);
    
    // Keep only last 1000 audit logs
    if (logs.length > 1000) {
      logs.splice(1000);
    }

    localStorage.setItem(this.AUDIT_KEY, JSON.stringify(logs));
    console.log('📋 Audit log added:', auditEntry);
  }

  // Get audit logs
  getAuditLogs(): AuditLog[] {
    try {
      const stored = localStorage.getItem(this.AUDIT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading audit logs:', error);
      return [];
    }
  }

  // Export data for backup
  exportData(): { records: SecureAttendanceRecord[], auditLogs: AuditLog[] } {
    return {
      records: this.getAttendanceRecords(),
      auditLogs: this.getAuditLogs()
    };
  }

  // Import data from backup (admin only)
  importData(data: { records: SecureAttendanceRecord[], auditLogs: AuditLog[] }): boolean {
    try {
      // Verify all imported records
      const validRecords = data.records.filter(record => this.verifyRecord(record));
      
      if (validRecords.length !== data.records.length) {
        console.warn(`🚨 ${data.records.length - validRecords.length} invalid records rejected during import`);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validRecords));
      localStorage.setItem(this.AUDIT_KEY, JSON.stringify(data.auditLogs));

      this.addAuditLog('DATA_IMPORTED', 'admin', {
        totalRecords: data.records.length,
        validRecords: validRecords.length,
        auditLogs: data.auditLogs.length
      });

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all data (admin only)
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.AUDIT_KEY);
    console.log('🗑️ All secure data cleared');
  }

  // Get integrity report
  getIntegrityReport(): { total: number, valid: number, tampered: number } {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return { total: 0, valid: 0, tampered: 0 };

    const records: SecureAttendanceRecord[] = JSON.parse(stored);
    const valid = records.filter(record => this.verifyRecord(record)).length;
    
    return {
      total: records.length,
      valid,
      tampered: records.length - valid
    };
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

// Authentication utilities
export class AuthManager {
  private readonly TOKEN_KEY = 'admin_token';
  private readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;

    try {
      const [, timestamp] = atob(token).split(':');
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      
      return (now - tokenTime) < this.SESSION_DURATION;
    } catch {
      return false;
    }
  }

  // Login with credentials
  login(username: string, password: string): boolean {
    // Demo credentials - in production, verify against secure backend
    if (username === 'admin' && password === 'admin123') {
      const token = btoa(`${username}:${Date.now()}`);
      localStorage.setItem(this.TOKEN_KEY, token);
      
      secureStorage.addAuditLog('ADMIN_LOGIN', username, {
        timestamp: new Date(),
        success: true
      });
      
      return true;
    }
    
    secureStorage.addAuditLog('ADMIN_LOGIN_FAILED', username, {
      timestamp: new Date(),
      success: false
    });
    
    return false;
  }

  // Logout
  logout(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      try {
        const [username] = atob(token).split(':');
        secureStorage.addAuditLog('ADMIN_LOGOUT', username, {
          timestamp: new Date()
        });
      } catch {
        // Invalid token
      }
    }
    
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // Get current user
  getCurrentUser(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token || !this.isAuthenticated()) return null;

    try {
      const [username] = atob(token).split(':');
      return username;
    } catch {
      return null;
    }
  }
}

export const authManager = new AuthManager();