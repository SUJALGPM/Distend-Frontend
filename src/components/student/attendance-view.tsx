import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { api } from '@/lib/api';
import { getAttendanceColor, getAttendanceStatus, formatDate } from '@/lib/utils';
import { AttendanceStats, Attendance } from '@/types';
import { Label } from 'recharts';


interface AttendanceViewProps {
  studentId: string;
}

export function AttendanceView({ studentId }: AttendanceViewProps) {
  const [attendanceData, setAttendanceData] = useState<{
    attendance: Attendance[];
    subjectStats: AttendanceStats[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchAttendanceData();
  }, [studentId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentAttendance(studentId);
      setAttendanceData(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = attendanceData?.attendance.filter(record => {
    const subjectMatch = selectedSubject === 'all' || record.subjectId._id === selectedSubject;
    const typeMatch = selectedType === 'all' || record.type === selectedType;
    return subjectMatch && typeMatch;
  }) || [];

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 75) return <TrendingUp className="h-4 w-4 text-safe-green-600" />;
    if (percentage >= 65) return <Minus className="h-4 w-4 text-warning-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-defaulter-red-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      

      {/* Subject-wise Attendance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attendanceData?.subjectStats.map((stat) => {
          const colorClass = getAttendanceColor(stat.percentage);
          const status = getAttendanceStatus(stat.percentage);
          
          return (
            <Card key={stat.subject._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{stat.subject.name}</CardTitle>
                    <CardDescription>{stat.subject.code}</CardDescription>
                  </div>
                  {getStatusIcon(stat.percentage)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Present: {stat.present}</span>
                    <span>Total: {stat.total}</span>
                  </div>
                  
                  <Progress 
                    value={stat.percentage} 
                    className={`h-3 bg-${colorClass}-50`}
                  />
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      status === 'Safe' ? 'safe' : 
                      status === 'Warning' ? 'warning' : 'defaulter'
                    }>
                      {status}
                    </Badge>
                    <span className={`text-lg font-bold text-${colorClass}-600`}>
                      {stat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Attendance Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="subject-filter" className="sr-only">Subject Filter</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject-filter">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {attendanceData?.subjectStats.map((stat) => (
                    <SelectItem key={stat.subject._id} value={stat.subject._id}>
                      {stat.subject.name} ({stat.subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="type-filter" className="sr-only">Type Filter</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Theory">Theory</SelectItem>
                  <SelectItem value="Practical">Practical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchAttendanceData}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Attendance Records
          </CardTitle>
          <CardDescription>
            Showing {filteredAttendance.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAttendance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attendance records found for the selected filters.
              </p>
            ) : (
              filteredAttendance.map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{record.subjectId.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.subjectId.code} • {record.type}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        record.status === 'Present' ? 'safe' :
                        record.status === 'Late' ? 'warning' :
                        record.status === 'Excused' ? 'secondary' : 'defaulter'
                      }
                    >
                      {record.status}
                    </Badge>
                    
                    <div className="text-right text-sm">
                      <div>{formatDate(record.createdAtDate)}</div>
                      <div className="text-muted-foreground">
                        {record.createdAtTime}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}