import { LeaveApplication, ODApplication, Incident, CalendarEvent, User } from '../types';
import { authManager } from './authManager';

class HRManager {
  private readonly LEAVE_KEY = 'leave_applications';
  private readonly OD_KEY = 'od_applications';
  private readonly INCIDENT_KEY = 'incidents';
  private readonly CALENDAR_KEY = 'calendar_events';

  // Leave Management
  getLeaveApplications(employeeId?: string): LeaveApplication[] {
    try {
      const stored = localStorage.getItem(this.LEAVE_KEY);
      const applications: LeaveApplication[] = stored ? JSON.parse(stored) : [];
      
      if (employeeId) {
        return applications.filter(app => app.employeeId === employeeId);
      }
      
      return applications;
    } catch {
      return [];
    }
  }

  submitLeaveApplication(application: Omit<LeaveApplication, 'id' | 'appliedDate' | 'status'>): LeaveApplication {
    const newApplication: LeaveApplication = {
      ...application,
      id: `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    const applications = this.getLeaveApplications();
    applications.unshift(newApplication);
    localStorage.setItem(this.LEAVE_KEY, JSON.stringify(applications));

    // Add calendar events for leave days
    this.addLeaveToCalendar(newApplication);

    return newApplication;
  }

  reviewLeaveApplication(
    id: string, 
    status: 'approved' | 'rejected', 
    reviewComments?: string
  ): boolean {
    const applications = this.getLeaveApplications();
    const appIndex = applications.findIndex(app => app.id === id);
    
    if (appIndex === -1) return false;

    const currentUser = authManager.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return false;

    applications[appIndex] = {
      ...applications[appIndex],
      status,
      reviewedBy: currentUser.fullName,
      reviewedDate: new Date().toISOString().split('T')[0],
      reviewComments
    };

    localStorage.setItem(this.LEAVE_KEY, JSON.stringify(applications));
    
    // Update calendar events
    this.updateLeaveCalendarStatus(applications[appIndex]);
    
    return true;
  }

  // OD Management
  getODApplications(employeeId?: string): ODApplication[] {
    try {
      const stored = localStorage.getItem(this.OD_KEY);
      const applications: ODApplication[] = stored ? JSON.parse(stored) : [];
      
      if (employeeId) {
        return applications.filter(app => app.employeeId === employeeId);
      }
      
      return applications;
    } catch {
      return [];
    }
  }

  submitODApplication(application: Omit<ODApplication, 'id' | 'appliedDate' | 'status'>): ODApplication {
    const newApplication: ODApplication = {
      ...application,
      id: `od_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    const applications = this.getODApplications();
    applications.unshift(newApplication);
    localStorage.setItem(this.OD_KEY, JSON.stringify(applications));

    return newApplication;
  }

  reviewODApplication(
    id: string, 
    status: 'approved' | 'rejected', 
    comments?: string,
    rejectionReason?: string
  ): boolean {
    const applications = this.getODApplications();
    const appIndex = applications.findIndex(app => app.id === id);
    
    if (appIndex === -1) return false;

    const currentUser = authManager.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return false;

    applications[appIndex] = {
      ...applications[appIndex],
      status,
      reviewedBy: currentUser.fullName,
      reviewedDate: new Date().toISOString().split('T')[0],
      ...(status === 'approved' ? { approvalComments: comments } : { rejectionReason: rejectionReason || comments })
    };

    localStorage.setItem(this.OD_KEY, JSON.stringify(applications));
    return true;
  }

  // Incident Management
  getIncidents(employeeId?: string): Incident[] {
    try {
      const stored = localStorage.getItem(this.INCIDENT_KEY);
      const incidents: Incident[] = stored ? JSON.parse(stored) : [];
      
      if (employeeId) {
        return incidents.filter(incident => incident.employeeId === employeeId);
      }
      
      return incidents;
    } catch {
      return [];
    }
  }

  createIncident(incident: Omit<Incident, 'id'>): Incident {
    const newIncident: Incident = {
      ...incident,
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    const incidents = this.getIncidents();
    incidents.unshift(newIncident);
    localStorage.setItem(this.INCIDENT_KEY, JSON.stringify(incidents));

    return newIncident;
  }

  updateIncident(id: string, updates: Partial<Incident>): boolean {
    const incidents = this.getIncidents();
    const incidentIndex = incidents.findIndex(incident => incident.id === id);
    
    if (incidentIndex === -1) return false;

    incidents[incidentIndex] = { ...incidents[incidentIndex], ...updates };
    localStorage.setItem(this.INCIDENT_KEY, JSON.stringify(incidents));
    return true;
  }

  // Calendar Management
  getCalendarEvents(employeeId?: string, month?: string): CalendarEvent[] {
    try {
      const stored = localStorage.getItem(this.CALENDAR_KEY);
      let events: CalendarEvent[] = stored ? JSON.parse(stored) : [];
      
      if (employeeId) {
        events = events.filter(event => event.employeeId === employeeId);
      }
      
      if (month) {
        events = events.filter(event => event.date.startsWith(month));
      }
      
      return events;
    } catch {
      return [];
    }
  }

  private addLeaveToCalendar(leave: LeaveApplication): void {
    const events = this.getCalendarEvents();
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Remove existing event for this date and employee
      const filteredEvents = events.filter(
        event => !(event.employeeId === leave.employeeId && event.date === dateStr)
      );
      
      // Add new leave event
      filteredEvents.push({
        id: `leave_${leave.id}_${dateStr}`,
        employeeId: leave.employeeId,
        date: dateStr,
        type: 'leave',
        title: `${leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave`,
        description: leave.reason,
        status: leave.status
      });
      
      events.length = 0;
      events.push(...filteredEvents);
    }
    
    localStorage.setItem(this.CALENDAR_KEY, JSON.stringify(events));
  }

  private updateLeaveCalendarStatus(leave: LeaveApplication): void {
    const events = this.getCalendarEvents();
    const updatedEvents = events.map(event => {
      if (event.id.startsWith(`leave_${leave.id}_`)) {
        return { ...event, status: leave.status };
      }
      return event;
    });
    
    localStorage.setItem(this.CALENDAR_KEY, JSON.stringify(updatedEvents));
  }

  // Get leave balance for employee
  getLeaveBalance(employeeId: string): { annual: number; sick: number; casual: number } {
    const applications = this.getLeaveApplications(employeeId);
    const currentYear = new Date().getFullYear().toString();
    
    const usedLeave = applications
      .filter(app => app.status === 'approved' && app.startDate.startsWith(currentYear))
      .reduce((acc, app) => {
        acc[app.leaveType] = (acc[app.leaveType] || 0) + app.totalDays;
        return acc;
      }, {} as Record<string, number>);

    return {
      annual: Math.max(0, 21 - (usedLeave.annual || 0)), // 21 days annual leave
      sick: Math.max(0, 12 - (usedLeave.sick || 0)), // 12 days sick leave
      casual: Math.max(0, 12 - (usedLeave.casual || 0)) // 12 days casual leave
    };
  }
}

export const hrManager = new HRManager();