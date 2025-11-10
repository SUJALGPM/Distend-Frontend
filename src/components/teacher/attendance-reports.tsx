import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDown, Filter, Users, BookOpen, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';


interface AttendanceReport {
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  records: any[];
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
}

export function AttendanceReports() {
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchAllocations();
    fetchReports();
  }, []);

  const fetchAllocations = async () => {
    try {
      const data = await api.getTeacherAllocations();
      // Deduplicate allocations by subjectId
      const uniqueAllocations = (data as any[]).reduce((acc: any[], curr: any) => {
        const exists = acc.find(a => a.subjectId._id === curr.subjectId._id);
        if (!exists) {
          acc.push(curr);
        }
        return acc;
      }, []);
      setAllocations(uniqueAllocations);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const filters = {
        subjectId: selectedSubject !== 'all' ? selectedSubject : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      
      const data = await api.getAttendanceReports(filters);
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (report: AttendanceReport) => {
    const csvData = [
      ['Student Name', 'Student ID', 'Status', 'Type', 'Date', 'Time'],
      ...report.records.map(record => [
        record.studentId.name,
        record.studentId.studentId,
        record.status,
        record.type,
        record.createdAtDate,
        record.createdAtTime
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.subject.code}_attendance_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAttendancePercentage = (stats: AttendanceReport['stats']) => {
    if (stats.total === 0) return 0;
    return Math.round(((stats.present + stats.late) / stats.total) * 100);
  };

  const getPieChartData = (stats: AttendanceReport['stats']) => [
    { name: 'Present', value: stats.present, color: '#22c55e' },
    { name: 'Absent', value: stats.absent, color: '#ef4444' },
    { name: 'Late', value: stats.late, color: '#eab308' },
    { name: 'Excused', value: stats.excused, color: '#6b7280' }
  ];

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
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Filter attendance reports by subject and date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject-filter">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject-filter">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {allocations.map((allocation) => (
                    <SelectItem key={allocation._id} value={allocation.subjectId._id}>
                      {allocation.subjectId.name} ({allocation.subjectId.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={fetchReports} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject-wise Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reports.map((report) => {
          const percentage = getAttendancePercentage(report.stats);
          const pieData = getPieChartData(report.stats);

          return (
            <Card key={report.subject._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{report.subject.name}</CardTitle>
                    <CardDescription>{report.subject.code}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={percentage >= 75 ? 'safe' : percentage >= 65 ? 'warning' : 'defaulter'}>
                      {percentage}%
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(report)}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Total Classes</span>
                      </div>
                      <p className="text-2xl font-bold">{report.stats.total}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Avg Attendance</span>
                      </div>
                      <p className="text-2xl font-bold">{percentage}%</p>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {pieData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {reports.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
            <p className="text-muted-foreground">
              No attendance records found for the selected filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Overall Statistics */}
      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Statistics</CardTitle>
            <CardDescription>Summary across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reports.map(report => ({
                  subject: report.subject.code,
                  percentage: getAttendancePercentage(report.stats),
                  total: report.stats.total
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}