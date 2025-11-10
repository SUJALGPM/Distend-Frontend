export interface User {
  id: string;
  role: 'admin' | 'teacher' | 'student';
  name: string;
  email: string;
}

export interface Student {
  _id: string;
  name: string;
  studentId: string;
  email: string;
  division: string;
  batch: string;
  contactNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  departmentId: Department;
  semesterId: Semester;
  createdAt: string;
}

export interface Teacher {
  _id: string;
  teacherName: string;
  teacherEmail: string;
  teacherGender: 'Male' | 'Female' | 'Other';
  teacherNumber: string;
  department: string;
  createdBy: string;
  createdAt: string;
}

export interface Department {
  _id: string;
  name: string;
  description: string;
  createdBy: string;
  semesters: string[];
  createdAt: string;
}

export interface Semester {
  _id: string;
  semesterNumber: number;
  academicYear: number;
  departmentId: string;
  startMonth: string;
  endMonth: string;
  subjects: string[];
  createdAt: string;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  departmentId: string;
  semesterId: string;
  createdAt: string;
}

export interface Attendance {
  _id: string;
  studentId: Student;
  subjectId: Subject;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  type: 'Theory' | 'Practical';
  recordedBy: Teacher;
  createdAtDate: string;
  createdAtTime: string;
}

export interface AttendanceStats {
  subject: Subject;
  total: number;
  present: number;
  percentage: number;
}

export interface Allocation {
  _id: string;
  subjectId: Subject;
  teacherId: string;
  students: Student[];
  type: 'Theory' | 'Practical';
  division: string;
  batch: string;
  totalPlanned: number;
  totalConducted: number;
  createdAt: string;
}

export interface Grievance {
  _id: string;
  studentId: Student;
  subjectId: Subject;
  title: string;
  description: string;
  attachments: string[];
  status: 'Pending' | 'Under Review' | 'Resolved' | 'Rejected';
  response?: string;
  reviewedBy?: Teacher;
  createdAt: string;
  updatedAt: string;
}

export interface Defaulter {
  student: {
    _id: string;
    name: string;
    studentId: string;
    email: string;
  };
  defaulterSubjects: {
    subject: Subject;
    total: number;
    present: number;
    percentage: number;
  }[];
}

export interface AnalyticsOverview {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalDepartments: number;
    totalSubjects: number;
    currentAttendanceRate: number;
  };
  departmentStats: {
    name: string;
    studentCount: number;
    semesterCount: number;
  }[];
  weeklyTrend: {
    date: string;
    attendanceRate: number;
  }[];
}

export interface SystemSettings {
  attendanceThreshold: number;
  defaulterAlertThreshold: number;
  autoNotifyDefaulters: boolean;
  allowGrievanceSubmission: boolean;
  maxGrievanceAttachments: number;
  csvUploadMaxSize: number;
  sessionTimeout: number;
}

export interface NotificationData {
  id: string;
  type: 'defaulter' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}