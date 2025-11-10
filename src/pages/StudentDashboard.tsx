import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceView } from '@/components/student/attendance-view';
import { NotificationPanel } from '@/components/student/notification-panel';
import { GrievanceForm } from '@/components/student/grievance-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}! Track your attendance and manage grievances.
          </p>
        </div>

        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="grievances">Grievances</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            <AttendanceView studentId={user.id} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationPanel studentId={user.id} />
          </TabsContent>

          <TabsContent value="grievances" className="space-y-6">
            <GrievanceForm studentId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}