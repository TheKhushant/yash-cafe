// src/routes/_authenticated.system-settings.tsx
import { useState } from "react";
import { ShieldCheck, Save, Globe, Bell, Users, Database } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    platformName: "Sports Bar Admin",
    supportEmail: "support@sportsbar.app",
    maxVenuesPerAdmin: 5,
    allowSelfRegistration: true,
    maintenanceMode: false,
    defaultTimezone: "Asia/Kolkata",
    emailNotifications: true,
    analyticsTracking: true,
    backupFrequency: "daily",
    systemMessage: "Welcome to the Sports Bar Platform",
  });

  const handleSave = () => {
    // In real app: call API to save settings
    toast.success("System settings saved successfully", {
      description: "Changes will take effect immediately.",
    });
  };

  const handleReset = () => {
    if (confirm("Reset all settings to defaults?")) {
      toast.info("Settings reset to defaults");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="System Settings"
        description="Global platform configuration and security"
        // icon={ShieldCheck}
      />

      <div className="grid gap-6">
        {/* General Settings */}
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="size-5 text-primary" />
            <h3 className="text-lg font-semibold">General</h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Default Timezone</Label>
              <Select
                value={settings.defaultTimezone}
                onValueChange={(v) => setSettings({ ...settings, defaultTimezone: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Venues per Admin</Label>
              <Input
                type="number"
                value={settings.maxVenuesPerAdmin}
                onChange={(e) => setSettings({ ...settings, maxVenuesPerAdmin: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </Card>

        {/* Security & Access */}
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="size-5 text-primary" />
            <h3 className="text-lg font-semibold">Security & Access</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Allow Self Registration</div>
                <div className="text-sm text-muted-foreground">New venue owners can sign up themselves</div>
              </div>
              <Switch
                checked={settings.allowSelfRegistration}
                onCheckedChange={(v) => setSettings({ ...settings, allowSelfRegistration: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Maintenance Mode</div>
                <div className="text-sm text-muted-foreground">Temporarily disable platform for all users</div>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">System-wide email alerts</div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
              />
            </div>
          </div>
        </Card>

        {/* Analytics & Data */}
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="size-5 text-primary" />
            <h3 className="text-lg font-semibold">Analytics & Data</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Analytics Tracking</div>
                <div className="text-sm text-muted-foreground">Enable detailed usage analytics</div>
              </div>
              <Switch
                checked={settings.analyticsTracking}
                onCheckedChange={(v) => setSettings({ ...settings, analyticsTracking: v })}
              />
            </div>

            <div className="space-y-2">
              <Label>Backup Frequency</Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(v) => setSettings({ ...settings, backupFrequency: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>System-Wide Message</Label>
              <Textarea
                value={settings.systemMessage}
                onChange={(e) => setSettings({ ...settings, systemMessage: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t">
        <Button onClick={handleSave} className="flex-1 gap-2">
          <Save className="size-4" />
          Save All Settings
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}