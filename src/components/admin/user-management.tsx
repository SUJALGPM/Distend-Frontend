import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Search, Plus, Edit, MoreHorizontal } from 'lucide-react';
import { api } from '@/lib/api';

interface User {
  _id: string;
  role: 'teacher' | 'student';
  name?: string;
  teacherName?: string;
  email?: string;
  teacherEmail?: string;
  studentId?: string;
  department?: string;
  departmentId?: { name: string };
  isActive?: boolean;
}

interface PaginationInfo {
  current: number;
  total: number;
  count: number;
  totalRecords: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createUserType, setCreateUserType] = useState<'teacher' | 'student'>('teacher');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, selectedRole, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data: any = await api.getUsers({
        role: selectedRole !== 'all' ? selectedRole : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: 10
      });
      
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, role: string) => {
    try {
      await api.toggleUserStatus(userId, role);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, isActive: !user.isActive }
          : user
      ));

      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
    setCurrentPage(1);
  };

  const getUserDisplayName = (user: User) => {
    return user.name || user.teacherName || 'Unknown';
  };

  const getUserEmail = (user: User) => {
    return user.email || user.teacherEmail || 'No email';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'secondary';
      case 'student':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage teachers and students in the system
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new teacher or student to the system
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm 
              userType={createUserType}
              onUserTypeChange={setCreateUserType}
              onSuccess={() => {
                setShowCreateDialog(false);
                fetchUsers();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Directory
          </CardTitle>
          <CardDescription>
            {pagination.totalRecords} total users • {pagination.count} showing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedRole} onValueChange={handleRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="student">Students</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((user) => (
              <div key={user._id} className="p-6 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {getUserDisplayName(user).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{getUserDisplayName(user)}</h3>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        {user.isActive === false && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{getUserEmail(user)}</span>
                        {user.studentId && <span>ID: {user.studentId}</span>}
                        {user.department && <span>Dept: {user.department}</span>}
                        {user.departmentId?.name && <span>Dept: {user.departmentId.name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${user._id}`} className="text-sm">
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </Label>
                      <Switch
                        id={`active-${user._id}`}
                        checked={user.isActive !== false}
                        onCheckedChange={() => toggleUserStatus(user._id, user.role)}
                      />
                    </div>

                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalRecords)} of {pagination.totalRecords} users
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <span className="text-sm">
              Page {currentPage} of {pagination.total}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(pagination.total, prev + 1))}
              disabled={currentPage === pagination.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Create User Form Component
function CreateUserForm({ 
  userType, 
  onUserTypeChange, 
  onSuccess 
}: { 
  userType: 'teacher' | 'student';
  onUserTypeChange: (type: 'teacher' | 'student') => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '', // For students (ObjectId)
    departmentName: '', // For teachers (string)
    semesterId: '', // For students (ObjectId)
    // Teacher specific
    teacherNumber: '',
    gender: 'Other',
    // Student specific
    studentId: '',
    division: '',
    batch: '',
    contactNumber: ''
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (formData.departmentId && userType === 'student') {
      fetchSemesters(formData.departmentId);
    } else {
      setSemesters([]);
      setFormData(prev => ({ ...prev, semesterId: '' }));
    }
  }, [formData.departmentId, userType]);

  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...');
      const data = await api.getDepartments();
      console.log('Departments received:', data);
      setDepartments(data as any[]);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  const fetchSemesters = async (departmentId: string) => {
    try {
      console.log('Fetching semesters for department:', departmentId);
      const data = await api.getSemestersByDepartment(departmentId);
      console.log('Semesters received:', data);
      setSemesters(data as any[]);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      setSemesters([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      if (userType === 'teacher') {
        await api.createTeacher({
          teacherName: formData.name,
          teacherEmail: formData.email,
          teacherPassword: formData.password,
          teacherGender: formData.gender,
          teacherNumber: formData.teacherNumber,
          department: formData.departmentName // Teachers use department name string
        });
      } else {
        await api.createStudent({
          name: formData.name,
          studentId: formData.studentId,
          email: formData.email,
          password: formData.password,
          division: formData.division,
          batch: formData.batch,
          contactNumber: formData.contactNumber,
          gender: formData.gender,
          departmentId: formData.departmentId, // Students use department ObjectId
          semesterId: formData.semesterId // Link to semester
        });
      }

      toast({
        title: "Success",
        description: `${userType.charAt(0).toUpperCase() + userType.slice(1)} created successfully`,
      });

      onSuccess();
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to create ${userType}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>User Type *</Label>
        <Select value={userType} onValueChange={(value) => onUserTypeChange(value as 'teacher' | 'student')}>
          <SelectTrigger>
            <SelectValue placeholder="Select user type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="student">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter full name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="email@example.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          placeholder="Enter password"
          required
          minLength={6}
        />
      </div>

      {userType === 'student' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID *</Label>
            <Input
              id="studentId"
              value={formData.studentId}
              onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
              placeholder="e.g., CS2021001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-department">Department *</Label>
            <Select 
              value={formData.departmentId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
            >
              <SelectTrigger id="student-department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.length === 0 ? (
                  <SelectItem value="none" disabled>No departments available</SelectItem>
                ) : (
                  departments.map((dept: any) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-semester">Semester *</Label>
            <Select 
              value={formData.semesterId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, semesterId: value }))}
              disabled={!formData.departmentId}
            >
              <SelectTrigger id="student-semester">
                <SelectValue placeholder={formData.departmentId ? "Select semester" : "Select department first"} />
              </SelectTrigger>
              <SelectContent>
                {semesters.length === 0 ? (
                  <SelectItem value="none" disabled>No semesters available</SelectItem>
                ) : (
                  semesters.map((sem: any) => (
                    <SelectItem key={sem._id} value={sem._id}>
                      Semester {sem.semesterNumber} ({sem.academicYear})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="division">Division *</Label>
              <Select 
                value={formData.division} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, division: value }))}
              >
                <SelectTrigger id="division">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Division A</SelectItem>
                  <SelectItem value="B">Division B</SelectItem>
                  <SelectItem value="C">Division C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">Batch *</Label>
              <Select 
                value={formData.batch} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, batch: value }))}
              >
                <SelectTrigger id="batch">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B1">Batch 1</SelectItem>
                  <SelectItem value="B2">Batch 2</SelectItem>
                  <SelectItem value="B3">Batch 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number *</Label>
            <Input
              id="contactNumber"
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
              placeholder="1234567890"
              required
            />
          </div>
        </>
      )}

      {userType === 'teacher' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="teacherNumber">Contact Number *</Label>
            <Input
              id="teacherNumber"
              type="tel"
              value={formData.teacherNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, teacherNumber: e.target.value }))}
              placeholder="1234567890"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher-department">Department *</Label>
            <Select 
              value={formData.departmentName} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, departmentName: value }))}
            >
              <SelectTrigger id="teacher-department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.length === 0 ? (
                  <SelectItem value="none" disabled>No departments available</SelectItem>
                ) : (
                  departments.map((dept: any) => (
                    <SelectItem key={dept._id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="gender">Gender *</Label>
        <Select 
          value={formData.gender} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
        >
          <SelectTrigger id="gender">
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : `Create ${userType.charAt(0).toUpperCase() + userType.slice(1)}`}
        </Button>
      </DialogFooter>
    </form>
  );
}