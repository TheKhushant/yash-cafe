// Create /home/workdir/attachments/yash-cafe-main/src/routes/_authenticated.settings.tsx
import { useState } from "react";
import { User, Bell, Clock, Palette, LogOut } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/stores/auth-store";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    notifications: true,
    darkMode: true,
    businessHours: "9:00 AM - 11:00 PM"
  });

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader 
        title="Settings" 
        description="Manage your venue preferences" 
        // icon={User}
      />

      <Card className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="size-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{user?.name}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Profile */}
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><User className="size-4" />Profile Information</h3>
            <div className="grid gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Bell className="size-4" />Notifications</h3>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive updates about orders and events</div>
              </div>
              <Switch checked={form.notifications} onCheckedChange={(v) => setForm({...form, notifications: v})} />
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock className="size-4" />Business Hours</h3>
            <Input value={form.businessHours} onChange={(e) => setForm({...form, businessHours: e.target.value})} />
          </div>

          {/* Theme */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Palette className="size-4" />Appearance</h3>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-muted-foreground">Use dark theme across the dashboard</div>
              </div>
              <Switch checked={form.darkMode} onCheckedChange={(v) => setForm({...form, darkMode: v})} />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-10 pt-6 border-t">
          <Button onClick={handleSave} className="flex-1">Save Changes</Button>
          <Button variant="outline" onClick={logout} className="gap-2 text-destructive hover:bg-destructive/10">
            <LogOut className="size-4" /> Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}