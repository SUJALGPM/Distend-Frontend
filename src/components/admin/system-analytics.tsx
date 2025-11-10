import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Users, GraduationCap, Building, BookOpen, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { AnalyticsOverview } from '@/types';

export function SystemAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverview | null>(null);
  const [subjectAnalytics, setSubjectAnalytics] = useState<any[]>([]);
  const [teacherAnalytics, setTeacherAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7days');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [overview, subjects, teachers] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getSubjectAnalytics(),
        api.getTeacherAnalytics()
      ]);

      setAnalyticsData(overview);
      setSubjectAnalytics(subjects);
      setTeacherAnalytics(teachers);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatusColor = (rate: number) => {
    if (rate >= 75) return 'text-safe-green-600';
    if (rate >= 65) return 'text-warning-yellow-600';
    return 'text-defaulter-red-600';
  };

  const getAttendanceStatusBadge = (rate: number) => {
    if (rate >= 75) return 'safe';
    if (rate >= 65) return 'warning';
    return 'defaulter';
  };

  const getTrendIcon = (current: number, previous: number = 70) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-safe-green-600" />;
    }
    return <TrendingDown className="h-4 w-4 text-defaulter-red-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of attendance management system
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="90days">90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={fetchAnalyticsData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.overview.totalStudents}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(analyticsData?.overview.totalStudents || 0)}
              <span className="ml-1">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.overview.totalTeachers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(analyticsData?.overview.totalTeachers || 0)}
              <span className="ml-1">+3% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.overview.totalDepartments}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{analyticsData?.overview.totalSubjects} subjects total</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getAttendanceStatusColor(analyticsData?.overview.currentAttendanceRate || 0)}`}>
              {analyticsData?.overview.currentAttendanceRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getAttendanceStatusBadge(analyticsData?.overview.currentAttendanceRate || 0)}>
                {analyticsData?.overview.currentAttendanceRate >= 75 ? 'Good' : 
                 analyticsData?.overview.currentAttendanceRate >= 65 ? 'Fair' : 'Poor'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Attendance Trend</CardTitle>
            <CardDescription>
              Daily attendance rates for the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData?.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const [day, month] = value.split('/');
                      return `${day}/${month}`;
                    }}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance Rate']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attendanceRate" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>
              Student enrollment by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="studentCount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Attendance Performance</CardTitle>
          <CardDescription>
            Average attendance rates across all subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectAnalytics.slice(0, 10).map((subject) => (
              <div key={subject.subject._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{subject.subject.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {subject.subject.code} • {subject.subject.department}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {subject.totalClasses} classes
                    </p>
                  </div>
                  
                  <Badge variant={getAttendanceStatusBadge(subject.averageAttendance)}>
                    {subject.averageAttendance.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Teacher Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Activity Overview</CardTitle>
          <CardDescription>
            Most active teachers by classes recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teacherAnalytics
              .sort((a, b) => b.classesRecorded - a.classesRecorded)
              .slice(0, 8)
              .map((teacher) => (
                <div key={teacher.teacher._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{teacher.teacher.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {teacher.teacher.department}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium">{teacher.classesRecorded}</p>
                      <p className="text-muted-foreground">Classes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{teacher.subjectsHandled}</p>
                      <p className="text-muted-foreground">Subjects</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}