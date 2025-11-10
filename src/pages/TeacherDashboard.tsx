import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceReports } from '@/components/teacher/attendance-reports';
import { AttendanceUpload } from '@/components/teacher/attendance-upload';
import { DefaulterListManager } from '@/components/teacher/defaulter-list-manager';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}! Manage attendance and track student performance.
          </p>
        </div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports">Attendance Reports</TabsTrigger>
            <TabsTrigger value="upload">Upload Attendance</TabsTrigger>
            <TabsTrigger value="defaulters">Defaulter Management</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <AttendanceReports />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <AttendanceUpload />
          </TabsContent>

          <TabsContent value="defaulters" className="space-y-6">
            <DefaulterListManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}