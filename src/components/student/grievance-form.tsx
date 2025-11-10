import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Upload, X, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import { socketManager } from '@/lib/socket';
import { Subject, Grievance } from '@/types';
import { formatDate } from '@/lib/utils';

const grievanceSchema = z.object({
  subjectId: z.string().min(1, 'Please select a subject'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

type GrievanceFormData = z.infer<typeof grievanceSchema>;

interface GrievanceFormProps {
  studentId: string;
}

export function GrievanceForm({ studentId }: GrievanceFormProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [myGrievances, setMyGrievances] = useState<Grievance[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<GrievanceFormData>({
    resolver: zodResolver(grievanceSchema)
  });

  const selectedSubjectId = watch('subjectId');

  useEffect(() => {
    fetchSubjects();
    fetchMyGrievances();
    
    // Listen for grievance status updates
    const socket = socketManager.getSocket();
    if (socket) {
      socketManager.onGrievanceStatus((data) => {
        if (data.studentId === studentId) {
          fetchMyGrievances(); // Refresh grievances list
          toast({
            title: "Grievance Updated",
            description: `Your grievance status has been updated to: ${data.status}`,
          });
        }
      });
    }

    return () => {
      socketManager.off('grievance-status');
    };
  }, [studentId, toast]);

  const fetchSubjects = async () => {
    try {
      console.log('Fetching student subjects...');
      const data: any = await api.getStudentSubjects();
      console.log('Subjects received:', data);
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    }
  };

  const fetchMyGrievances = async () => {
    try {
      setLoading(true);
      const data: any = await api.getMyGrievances();
      setMyGrievances(data);
    } catch (error) {
      console.error('Error fetching grievances:', error);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles].slice(0, 5));
    },
    onDropRejected: (rejectedFiles) => {
      toast({
        title: "File Upload Error",
        description: "Some files were rejected. Please check file type and size limits.",
        variant: "destructive",
      });
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: GrievanceFormData) => {
    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('subjectId', data.subjectId);
      formData.append('title', data.title);
      formData.append('description', data.description);
      
      files.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.submitGrievance(formData);
      
      toast({
        title: "Success",
        description: "Your grievance has been submitted successfully",
      });

      // Reset form
      reset();
      setFiles([]);
      
      // Refresh grievances list
      fetchMyGrievances();
      
    } catch (error) {
      console.error('Error submitting grievance:', error);
      toast({
        title: "Error",
        description: "Failed to submit grievance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4 text-warning-yellow-600" />;
      case 'Under Review':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'Resolved':
        return <CheckCircle className="h-4 w-4 text-safe-green-600" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-defaulter-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Resolved':
        return 'safe';
      case 'Rejected':
        return 'defaulter';
      case 'Under Review':
        return 'secondary';
      case 'Pending':
      default:
        return 'warning';
    }
  };

  return (
    <div className="space-y-6">
      {/* Submit New Grievance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submit Attendance Grievance
          </CardTitle>
          <CardDescription>
            Report any attendance discrepancies or issues with your records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select 
                  value={selectedSubjectId} 
                  onValueChange={(value) => {
                    setValue('subjectId', value);
                  }}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length === 0 ? (
                      <SelectItem value="none" disabled>No subjects available</SelectItem>
                    ) : (
                      subjects.map((subject) => (
                        <SelectItem key={subject._id} value={subject._id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.subjectId && (
                  <p className="text-sm text-destructive">{errors.subjectId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Grievance Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief title for your grievance"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the attendance issue..."
                rows={4}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Supporting Documents (Optional)</Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Drop files here...'
                    : 'Drag & drop files here, or click to select'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: Images, PDF, DOC, DOCX (Max 5 files, 5MB each)
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files:</Label>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Submit Grievance'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My Grievances */}
      <Card>
        <CardHeader>
          <CardTitle>My Grievances</CardTitle>
          <CardDescription>
            Track the status of your submitted grievances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : myGrievances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No grievances submitted yet</p>
              <p className="text-sm">Submit your first grievance using the form above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myGrievances.map((grievance) => (
                <div key={grievance._id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{grievance.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {grievance.subjectId.name} ({grievance.subjectId.code})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(grievance.status)}
                      <Badge variant={getStatusBadgeVariant(grievance.status)}>
                        {grievance.status}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm mb-3">{grievance.description}</p>

                  {grievance.response && (
                    <div className="bg-muted p-3 rounded-lg mb-3">
                      <Label className="text-sm font-medium">Response:</Label>
                      <p className="text-sm mt-1">{grievance.response}</p>
                      {grievance.reviewedBy && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Reviewed by: {grievance.reviewedBy.teacherName}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Submitted: {formatDate(grievance.createdAt)}</span>
                    <span>Updated: {formatDate(grievance.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}