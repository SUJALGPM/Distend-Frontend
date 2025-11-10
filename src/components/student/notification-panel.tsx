import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Info, CheckCircle, X, RefreshCw } from 'lucide-react';
import { socketManager } from '@/lib/socket';
import { NotificationData } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';

interface NotificationPanelProps {
  studentId: string;
}

export function NotificationPanel({ studentId }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to real-time notifications
    const socket = socketManager.getSocket();
    
    if (socket) {
      // Listen for defaulter alerts
      socketManager.onDefaulterAlert((data) => {
        const defaulterNotification: NotificationData = {
          id: `defaulter-${Date.now()}`,
          type: 'defaulter',
          title: 'Attendance Alert!',
          message: `Your attendance has fallen below the required threshold in ${data.subjects?.length || 0} subject(s).`,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        setNotifications(prev => [defaulterNotification, ...prev]);
      });

      // Listen for grievance status updates
      socketManager.onGrievanceStatus((data) => {
        if (data.studentId === studentId) {
          const grievanceNotification: NotificationData = {
            id: `grievance-${data.grievanceId}`,
            type: data.status === 'Resolved' ? 'success' : 'info',
            title: 'Grievance Update',
            message: `Your grievance status has been updated to: ${data.status}`,
            timestamp: new Date().toISOString(),
            read: false
          };
          
          setNotifications(prev => [grievanceNotification, ...prev]);
        }
      });

      // Subscribe to defaulter alerts
      socketManager.subscribeToDefaulterAlerts();
    }

    // Load initial notifications (mock data for demo)
    loadInitialNotifications();

    return () => {
      // Clean up listeners
      socketManager.off('defaulter-alert');
      socketManager.off('grievance-status');
    };
  }, [studentId]);

  const loadInitialNotifications = () => {
    // Mock initial notifications
    const mockNotifications: NotificationData[] = [
      {
        id: '1',
        type: 'warning',
        title: 'Attendance Warning',
        message: 'Your attendance in Mathematics is at 68%. Please maintain regular attendance.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        read: false
      },
      {
        id: '2',
        type: 'info',
        title: 'New Assignment',
        message: 'A new assignment has been posted for Physics Lab.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        read: true
      },
      {
        id: '3',
        type: 'success',
        title: 'Grievance Resolved',
        message: 'Your attendance grievance for Chemistry has been resolved.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        read: true
      }
    ];

    setNotifications(mockNotifications);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'defaulter':
        return <AlertTriangle className="h-5 w-5 text-defaulter-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-yellow-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-safe-green-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationBadgeVariant = (type: NotificationData['type']) => {
    switch (type) {
      case 'defaulter':
        return 'defaulter';
      case 'warning':
        return 'warning';
      case 'success':
        return 'safe';
      case 'info':
      default:
        return 'secondary';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadInitialNotifications}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Stay updated with your attendance alerts and important announcements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm">You'll see important updates here</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg transition-colors ${
                  notification.read 
                    ? 'bg-muted/30 border-muted' 
                    : 'bg-background border-border shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h4>
                          <Badge 
                            variant={getNotificationBadgeVariant(notification.type)}
                            className="text-xs"
                          >
                            {notification.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className={`text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(notification.timestamp.split('T')[0].replace(/-/g, '/'))} at{' '}
                          {formatTime(notification.timestamp.split('T')[1].split('.')[0])}
                        </p>
                      </div>
                      
                      <div className="flex gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 w-8 p-0"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNotification(notification.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}