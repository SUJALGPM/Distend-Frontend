import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle, Bell, FileDown, Mail, Search, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { socketManager } from '@/lib/socket';
import { Defaulter } from '@/types';
import { getAttendanceColor } from '@/lib/utils';

export function DefaulterListManager() {
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [threshold, setThreshold] = useState([75]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDefaulters, setSelectedDefaulters] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDefaulters();
  }, []);

  const fetchDefaulters = async () => {
    try {
      setLoading(true);
      const data = await api.getDefaulters(threshold[0]);
      setDefaulters(data);
    } catch (error) {
      console.error('Error fetching defaulters:', error);
      toast({
        title: "Error",
        description: "Failed to load defaulter list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = (newThreshold: number[]) => {
    setThreshold(newThreshold);
  };

  const applyThreshold = () => {
    fetchDefaulters();
  };

  const notifyDefaulters = async () => {
    try {
      setNotifying(true);
      
      // In a real app, this would call an API to send notifications
      // For now, we'll simulate the notification process
      
      const studentsToNotify = selectedDefaulters.length > 0 
        ? defaulters.filter(d => selectedDefaulters.includes(d.student._id))
        : defaulters;

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Emit socket event for real-time notifications
      const socket = socketManager.getSocket();
      if (socket) {
        studentsToNotify.forEach(defaulter => {
          socket.emit('defaulter-notification', {
            studentId: defaulter.student._id,
            subjects: defaulter.defaulterSubjects,
            threshold: threshold[0]
          });
        });
      }

      toast({
        title: "Notifications Sent",
        description: `Sent attendance alerts to ${studentsToNotify.length} student(s)`,
      });

      setSelectedDefaulters([]);
      
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast({
        title: "Error",
        description: "Failed to send notifications",
        variant: "destructive",
      });
    } finally {
      setNotifying(false);
    }
  };

  const exportToPDF = () => {
    // In a real app, this would generate a PDF report
    // For now, we'll create a CSV export
    const csvData = [
      ['Student Name', 'Student ID', 'Email', 'Subject', 'Subject Code', 'Attendance %', 'Total Classes', 'Present Classes'],
      ...defaulters.flatMap(defaulter =>
        defaulter.defaulterSubjects.map(subject => [
          defaulter.student.name,
          defaulter.student.studentId,
          defaulter.student.email,
          subject.subject.name,
          subject.subject.code,
          subject.percentage.toFixed(1),
          subject.total.toString(),
          subject.present.toString()
        ])
      )
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `defaulters_report_${threshold[0]}percent.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Defaulters report has been downloaded",
    });
  };

  const toggleDefaulterSelection = (studentId: string) => {
    setSelectedDefaulters(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllDefaulters = () => {
    if (selectedDefaulters.length === filteredDefaulters.length) {
      setSelectedDefaulters([]);
    } else {
      setSelectedDefaulters(filteredDefaulters.map(d => d.student._id));
    }
  };

  const filteredDefaulters = defaulters.filter(defaulter =>
    defaulter.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    defaulter.student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    defaulter.student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Threshold Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Attendance Threshold
          </CardTitle>
          <CardDescription>
            Set the minimum attendance percentage to identify defaulters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Threshold: {threshold[0]}%</Label>
              <Badge variant={threshold[0] >= 75 ? 'safe' : threshold[0] >= 65 ? 'warning' : 'defaulter'}>
                {threshold[0] >= 75 ? 'Standard' : threshold[0] >= 65 ? 'Lenient' : 'Strict'}
              </Badge>
            </div>
            
            <Slider
              value={threshold}
              onValueChange={handleThresholdChange}
              max={100}
              min={50}
              step={5}
              className="w-full"
            />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <Button onClick={applyThreshold} className="w-full">
            Apply Threshold
          </Button>
        </CardContent>
      </Card>

      {/* Actions and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-defaulter-red-600" />
                Defaulter Management
              </CardTitle>
              <CardDescription>
                {filteredDefaulters.length} student(s) below {threshold[0]}% attendance
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportToPDF}
                disabled={filteredDefaulters.length === 0}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button
                onClick={notifyDefaulters}
                disabled={filteredDefaulters.length === 0 || notifying}
                className="bg-defaulter-red-600 hover:bg-defaulter-red-700"
              >
                <Bell className="h-4 w-4 mr-2" />
                {notifying ? 'Sending...' : 'Notify Students'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={selectAllDefaulters}
              disabled={filteredDefaulters.length === 0}
            >
              {selectedDefaulters.length === filteredDefaulters.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {selectedDefaulters.length > 0 && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                {selectedDefaulters.length} student(s) selected for notification
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Defaulters List */}
      {filteredDefaulters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-safe-green-600" />
            <h3 className="text-lg font-medium mb-2">No Defaulters Found</h3>
            <p className="text-muted-foreground">
              All students are maintaining attendance above {threshold[0]}%
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDefaulters.map((defaulter) => (
            <Card key={defaulter.student._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedDefaulters.includes(defaulter.student._id)}
                    onChange={() => toggleDefaulterSelection(defaulter.student._id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{defaulter.student.name}</h3>
                        <p className="text-muted-foreground">
                          {defaulter.student.studentId} • {defaulter.student.email}
                        </p>
                      </div>
                      
                      <Badge variant="defaulter" className="ml-2">
                        {defaulter.defaulterSubjects.length} Subject(s)
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {defaulter.defaulterSubjects.map((subject) => {
                        const colorClass = getAttendanceColor(subject.percentage);
                        
                        return (
                          <div
                            key={subject.subject._id}
                            className={`p-3 rounded-lg border-l-4 border-l-${colorClass}-500 bg-${colorClass}-50`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm">{subject.subject.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {subject.subject.code}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {subject.present}/{subject.total} classes
                              </span>
                              <span className={`font-bold text-${colorClass}-700`}>
                                {subject.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}