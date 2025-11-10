import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.token = token;
    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  // Attendance events
  onAttendanceUpdated(callback: (data: any) => void) {
    this.socket?.on('attendance-updated', callback);
  }

  onDefaulterAlert(callback: (data: any) => void) {
    this.socket?.on('defaulter-alert', callback);
  }

  joinAttendanceRoom(subjectId: string, classId: string) {
    this.socket?.emit('join-attendance-room', { subjectId, classId });
  }

  leaveAttendanceRoom(subjectId: string, classId: string) {
    this.socket?.emit('leave-attendance-room', { subjectId, classId });
  }

  markAttendanceLive(data: {
    subjectId: string;
    classId: string;
    studentId: string;
    status: string;
  }) {
    this.socket?.emit('mark-attendance-live', data);
  }

  onAttendanceMarkedLive(callback: (data: any) => void) {
    this.socket?.on('attendance-marked-live', callback);
  }

  // Grievance events
  onGrievanceSubmitted(callback: (data: any) => void) {
    this.socket?.on('grievance-submitted', callback);
  }

  onGrievanceStatus(callback: (data: any) => void) {
    this.socket?.on('grievance-status', callback);
  }

  joinGrievanceRoom(grievanceId: string) {
    this.socket?.emit('join-grievance-room', grievanceId);
  }

  // Notification events
  subscribeToDefaulterAlerts() {
    this.socket?.emit('subscribe-defaulter-alerts');
  }

  subscribeToSystemNotifications() {
    this.socket?.emit('subscribe-system-notifications');
  }

  // Clean up event listeners
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const socketManager = new SocketManager();