import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { Settings, Save, RefreshCw, AlertTriangle, Bell, Upload, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { SystemSettings as SystemSettingsType } from '@/types';

const settingsSchema = z.object({
  attendanceThreshold: z.number().min(50).max(100),
  defaulterAlertThreshold: z.number().min(40).max(90),
  autoNotifyDefaulters: z.boolean(),
  allowGrievanceSubmission: z.boolean(),
  maxGrievanceAttachments: z.number().min(1).max(10),
  csvUploadMaxSize: z.number().min(1).max(50),
  sessionTimeout: z.number().min(1).max(168), // 1 hour to 1 week
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema)
  });

  const watchedValues = watch();

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setSaving(true);
      await api.updateSystemSettings(data);
      
      setSettings(data);
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully",
      });

      // Reset form dirty state
      reset(data);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: SystemSettingsType = {
      attendanceThreshold: 75,
      defaulterAlertThreshold: 70,
      autoNotifyDefaulters: true,
      allowGrievanceSubmission: true,
      maxGrievanceAttachments: 5,
      csvUploadMaxSize: 5,
      sessionTimeout: 24
    };

    reset(defaultSettings);
    toast({
      title: "Reset to Defaults",
      description: "Settings have been reset to default values",
    });
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">
            Configure attendance management system parameters
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Attendance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Attendance Thresholds
            </CardTitle>
            <CardDescription>
              Configure attendance percentage thresholds for warnings and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Minimum Attendance Threshold</Label>
                <span className="text-sm font-medium">
                  {watchedValues.attendanceThreshold}%
                </span>
              </div>
              <Slider
                value={[watchedValues.attendanceThreshold || 75]}
                onValueChange={(value) => setValue('attendanceThreshold', value[0])}
                max={100}
                min={50}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Students below this percentage will be marked as defaulters
              </p>
              {errors.attendanceThreshold && (
                <p className="text-sm text-destructive">{errors.attendanceThreshold.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Defaulter Alert Threshold</Label>
                <span className="text-sm font-medium">
                  {watchedValues.defaulterAlertThreshold}%
                </span>
              </div>
              <Slider
                value={[watchedValues.defaulterAlertThreshold || 70]}
                onValueChange={(value) => setValue('defaulterAlertThreshold', value[0])}
                max={90}
                min={40}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Send alerts when attendance drops below this threshold
              </p>
              {errors.defaulterAlertThreshold && (
                <p className="text-sm text-destructive">{errors.defaulterAlertThreshold.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure automatic notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-notify Defaulters</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send notifications to students when they become defaulters
                </p>
              </div>
              <Switch
                checked={watchedValues.autoNotifyDefaulters}
                onCheckedChange={(checked) => setValue('autoNotifyDefaulters', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Grievance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Grievance System
            </CardTitle>
            <CardDescription>
              Configure grievance submission and handling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Allow Grievance Submission</Label>
                <p className="text-sm text-muted-foreground">
                  Enable students to submit attendance grievances
                </p>
              </div>
              <Switch
                checked={watchedValues.allowGrievanceSubmission}
                onCheckedChange={(checked) => setValue('allowGrievanceSubmission', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Attachments per Grievance</Label>
              <Input
                type="number"
                min={1}
                max={10}
                {...register('maxGrievanceAttachments', { valueAsNumber: true })}
              />
              <p className="text-sm text-muted-foreground">
                Maximum number of files students can attach to a grievance
              </p>
              {errors.maxGrievanceAttachments && (
                <p className="text-sm text-destructive">{errors.maxGrievanceAttachments.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Upload Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Upload Settings
            </CardTitle>
            <CardDescription>
              Configure file upload limits and restrictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>CSV Upload Maximum Size (MB)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                {...register('csvUploadMaxSize', { valueAsNumber: true })}
              />
              <p className="text-sm text-muted-foreground">
                Maximum file size for CSV attendance uploads
              </p>
              {errors.csvUploadMaxSize && (
                <p className="text-sm text-destructive">{errors.csvUploadMaxSize.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Settings
            </CardTitle>
            <CardDescription>
              Configure user session and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Session Timeout (hours)</Label>
              <Input
                type="number"
                min={1}
                max={168}
                {...register('sessionTimeout', { valueAsNumber: true })}
              />
              <p className="text-sm text-muted-foreground">
                How long users stay logged in before automatic logout
              </p>
              {errors.sessionTimeout && (
                <p className="text-sm text-destructive">{errors.sessionTimeout.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(settings)}
            disabled={!isDirty}
          >
            Cancel Changes
          </Button>
          
          <Button
            type="submit"
            disabled={saving || !isDirty}
            className="min-w-32"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {isDirty && (
          <div className="bg-warning-yellow-50 border border-warning-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-yellow-600" />
              <p className="text-sm text-warning-yellow-800">
                You have unsaved changes. Don't forget to save your settings.
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}