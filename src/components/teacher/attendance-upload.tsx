import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Download, FileText, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';

interface UploadHistory {
  id: string;
  fileName: string;
  subjectName: string;
  subjectCode: string;
  recordsCount: number;
  uploadedAt: string;
  status: 'success' | 'error' | 'processing';
  errorMessage?: string;
}

export function AttendanceUpload() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('Theory');
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllocations();
    loadUploadHistory();
  }, []);

  const fetchAllocations = async () => {
    try {
      const data: any = await api.getTeacherAllocations();
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
      toast({
        title: "Error",
        description: "Failed to load subject allocations",
        variant: "destructive",
      });
    }
  };

  const loadUploadHistory = () => {
    // Mock upload history - in real app, this would come from API
    const mockHistory: UploadHistory[] = [
      {
        id: '1',
        fileName: 'mathematics_attendance_nov2024.csv',
        subjectName: 'Mathematics',
        subjectCode: 'MATH101',
        recordsCount: 45,
        uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '2',
        fileName: 'physics_lab_attendance.csv',
        subjectName: 'Physics Lab',
        subjectCode: 'PHY201L',
        recordsCount: 0,
        uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'error',
        errorMessage: 'Invalid CSV format: Missing required columns'
      },
      {
        id: '3',
        fileName: 'chemistry_theory_oct2024.csv',
        subjectName: 'Chemistry',
        subjectCode: 'CHEM101',
        recordsCount: 38,
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'success'
      }
    ];
    setUploadHistory(mockHistory);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0 && selectedSubject) {
        await handleFileUpload(acceptedFiles[0]);
      }
    },
    onDropRejected: (rejectedFiles) => {
      toast({
        title: "File Upload Error",
        description: "Please upload a valid CSV/Excel file (max 10MB)",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = async (file: File) => {
    if (!selectedSubject) {
      toast({
        title: "Error",
        description: "Please select a subject before uploading",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('subjectId', selectedSubject);
      formData.append('type', selectedType);

      const result: any = await api.uploadAttendanceCSV(formData);

      // Add to upload history
      const newHistoryItem: UploadHistory = {
        id: Date.now().toString(),
        fileName: file.name,
        subjectName: allocations.find(a => a.subjectId._id === selectedSubject)?.subjectId.name || 'Unknown',
        subjectCode: allocations.find(a => a.subjectId._id === selectedSubject)?.subjectId.code || 'Unknown',
        recordsCount: result.recordsCreated,
        uploadedAt: new Date().toISOString(),
        status: 'success'
      };

      setUploadHistory(prev => [newHistoryItem, ...prev]);

      toast({
        title: "Success",
        description: `Successfully uploaded ${result.recordsCreated} attendance records`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Add failed upload to history
      const failedHistoryItem: UploadHistory = {
        id: Date.now().toString(),
        fileName: file.name,
        subjectName: allocations.find(a => a.subjectId._id === selectedSubject)?.subjectId.name || 'Unknown',
        subjectCode: allocations.find(a => a.subjectId._id === selectedSubject)?.subjectId.code || 'Unknown',
        recordsCount: 0,
        uploadedAt: new Date().toISOString(),
        status: 'error',
        errorMessage: error.message || 'Upload failed'
      };

      setUploadHistory(prev => [failedHistoryItem, ...prev]);

      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload attendance file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['studentId', 'status'],
      ['STU001', 'Present'],
      ['STU002', 'Absent'],
      ['STU003', 'Late'],
      ['STU004', 'Present'],
      ['STU005', 'Excused']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_sample_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const removeFromHistory = (id: string) => {
    setUploadHistory(prev => prev.filter(item => item.id !== id));
  };

  const getStatusIcon = (status: UploadHistory['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-safe-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-defaulter-red-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning-yellow-600 animate-spin" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: UploadHistory['status']) => {
    switch (status) {
      case 'success':
        return 'safe';
      case 'error':
        return 'defaulter';
      case 'processing':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Attendance Data
          </CardTitle>
          <CardDescription>
            Upload CSV or Excel files with student attendance records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject and Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject-select">Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {allocations.length === 0 ? (
                    <SelectItem value="none" disabled>No subjects available</SelectItem>
                  ) : (
                    allocations.map((allocation) => (
                      <SelectItem key={allocation._id} value={allocation.subjectId._id}>
                        {allocation.subjectId.name} ({allocation.subjectId.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!selectedSubject && (
                <p className="text-xs text-muted-foreground">
                  Please select a subject before uploading
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-select">Class Type *</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="type-select">
                  <SelectValue placeholder="Select class type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Theory">Theory</SelectItem>
                  <SelectItem value="Practical">Practical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            } ${!selectedSubject ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={!selectedSubject || uploading} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              {uploading ? 'Uploading...' : 
               isDragActive ? 'Drop file here' : 
               'Drag & drop your file here'}
            </h3>
            <p className="text-muted-foreground mb-4">
              or click to browse files
            </p>
            <p className="text-sm text-muted-foreground">
              Supports: CSV, XLS, XLSX (Max 10MB)
            </p>
            {!selectedSubject && (
              <p className="text-sm text-destructive mt-2">
                Please select a subject first
              </p>
            )}
          </div>

          {/* Sample Template Download */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={downloadSampleCSV}>
              <Download className="h-4 w-4 mr-2" />
              Download Sample Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload History
          </CardTitle>
          <CardDescription>
            Recent file uploads and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No uploads yet</p>
              <p className="text-sm">Your upload history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(item.status)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{item.fileName}</h4>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {item.subjectName} ({item.subjectCode})
                        {item.status === 'success' && ` • ${item.recordsCount} records`}
                      </p>
                      
                      {item.errorMessage && (
                        <p className="text-sm text-destructive mt-1">
                          {item.errorMessage}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(item.uploadedAt.split('T')[0].replace(/-/g, '/'))} at{' '}
                        {formatTime(item.uploadedAt.split('T')[1].split('.')[0])}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromHistory(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">Required Columns:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><code>studentId</code> - Student ID (must match existing students)</li>
                <li><code>status</code> - Attendance status (Present, Absent, Late, Excused)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Important Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>First row should contain column headers</li>
                <li>Student IDs must exist in the system</li>
                <li>Status values are case-sensitive</li>
                <li>Maximum file size: 10MB</li>
                <li>Supported formats: CSV, XLS, XLSX</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}