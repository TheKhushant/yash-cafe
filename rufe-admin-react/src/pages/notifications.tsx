// Create /home/workdir/attachments/yash-cafe-main/src/routes/_authenticated.notifications.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notificationsService, type NotificationInput } from "@/lib/api/services/notifications.service";
import { formatDateTime } from "@/lib/format";
import type { AppNotification } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

const EMPTY: NotificationInput = {
  title: "",
  message: "",
  type: "Announcement",
  audience: "All",
};

function NotificationsPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NotificationInput>(EMPTY);
  const [toDelete, setToDelete] = useState<AppNotification | null>(null);

  const notifications = useQuery({
    queryKey: ["notifications", scope],
    queryFn: () => notificationsService.list(scope),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });

  const send = useMutation({
    mutationFn: () => notificationsService.send(form, scope),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setForm(EMPTY);
      toast.success("Notification sent successfully");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => notificationsService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Notification deleted");
    },
  });

  const columns: Column<AppNotification>[] = [
    { 
      key: "title", 
      header: "Title", 
      render: (n) => <span className="font-medium">{n.title}</span>,
      sortValue: (n) => n.title 
    },
    { 
      key: "type", 
      header: "Type", 
      render: (n) => <StatusBadge status={n.type} />,
      sortValue: (n) => n.type 
    },
    { 
      key: "audience", 
      header: "Audience" 
    },
    { 
      key: "sentAt", 
      header: "Sent", 
      render: (n) => formatDateTime(n.sentAt),
      sortValue: (n) => n.sentAt 
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (n) => (
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-destructive" 
          onClick={() => setToDelete(n)}
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Send announcements and match reminders"
        actions={
          <Button onClick={() => { setForm(EMPTY); setOpen(true); }}>
            <Plus className="size-4 mr-2" />
            New Notification
          </Button>
        }
        // icon={Bell}
      />

      {notifications.isLoading ? (
        <PageSkeleton />
      ) : (
        <DataTable
          data={notifications.data ?? []}
          columns={columns}
          rowKey={(n) => n.id}
          searchKeys={["title", "message"]}
          searchPlaceholder="Search notifications..."
        />
      )}

      {/* Compose Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send New Notification</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={form.type} 
                onValueChange={(v) => setForm({ ...form, type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Announcement">Announcement</SelectItem>
                  <SelectItem value="Match Reminder">Match Reminder</SelectItem>
                  <SelectItem value="Order Ready">Order Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Audience</Label>
              <Select 
                value={form.audience} 
                onValueChange={(v) => setForm({ ...form, audience: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Customers</SelectItem>
                  <SelectItem value="CheckedIn">Checked-in Guests</SelectItem>
                  <SelectItem value="Staff">Staff Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Match starting soon!"
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                placeholder="The match between Manchester United and Liverpool starts in 15 minutes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => send.mutate()} 
              disabled={!form.title || !form.message || send.isPending}
            >
              <Send className="size-4 mr-2" />
              {send.isPending ? "Sending..." : "Send Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete Notification?"
        description={`This will permanently remove "${toDelete?.title}".`}
        destructive
        confirmLabel="Delete"
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}