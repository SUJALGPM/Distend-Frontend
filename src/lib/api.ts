const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string; role: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  // Attendance endpoints
  async markAttendance(attendanceRecords: any[]) {
    return this.request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ attendanceRecords }),
    });
  }

  async uploadAttendanceCSV(formData: FormData) {
    return this.request('/attendance/upload-csv', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  async getStudentAttendance(studentId: string) {
    return this.request(`/attendance/student/${studentId}`);
  }

  async getDefaulters(threshold: number = 75) {
    return this.request(`/attendance/defaulters?threshold=${threshold}`);
  }

  // Analytics endpoints
  async getAnalyticsOverview() {
    return this.request('/analytics/overview');
  }

  async getSubjectAnalytics() {
    return this.request('/analytics/subjects');
  }

  async getTeacherAnalytics() {
    return this.request('/analytics/teachers');
  }

  // Grievance endpoints
  async submitGrievance(formData: FormData) {
    return this.request('/grievances/submit', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: formData,
    });
  }

  async getMyGrievances() {
    return this.request('/grievances/my');
  }

  async getAllGrievances(filters?: { status?: string; subjectId?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    
    return this.request(`/grievances/all?${params.toString()}`);
  }

  async updateGrievanceStatus(grievanceId: string, data: { status: string; response?: string }) {
    return this.request(`/grievances/${grievanceId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints
  async getUsers(filters?: { role?: string; search?: string; page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    return this.request(`/admin/users?${params.toString()}`);
  }

  async createTeacher(teacherData: any) {
    return this.request('/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  }

  async createStudent(studentData: any) {
    return this.request('/admin/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async getSystemSettings() {
    return this.request('/admin/settings');
  }

  async updateSystemSettings(settings: any) {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async toggleUserStatus(userId: string, role: string) {
    return this.request(`/admin/users/${userId}/toggle-status`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getDepartments() {
    return this.request('/admin/departments');
  }

  async getSemestersByDepartment(departmentId: string) {
    return this.request(`/admin/departments/${departmentId}/semesters`);
  }

  // Teacher endpoints
  async getTeacherAllocations() {
    return this.request('/teacher/allocations');
  }

  async getAttendanceReports(filters?: { subjectId?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    return this.request(`/teacher/attendance-reports?${params.toString()}`);
  }

  // Student endpoints
  async getStudentProfile() {
    return this.request('/student/profile');
  }

  async getStudentSubjects() {
    return this.request('/student/subjects');
  }

  async getAttendanceSummary() {
    return this.request('/student/attendance-summary');
  }
}

export const api = new ApiClient(API_BASE_URL);