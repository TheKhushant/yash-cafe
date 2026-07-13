// src/routes/_authenticated.platform-users.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { UsersRound, Plus, Shield, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usersService } from "@/lib/api/services/users.service"; // Platform-level users
import { formatDate } from "@/lib/format";
import type { PlatformUser } from "@/types";

export default function PlatformUsersPage() {
  const qc = useQueryClient();
  const [activeUser, setActiveUser] = useState<PlatformUser | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "admin" as "admin" | "super_admin",
  });
  const [toBlock, setToBlock] = useState<PlatformUser | null>(null);

  const platformUsers = useQuery({
    queryKey: ["platform-users"],
    queryFn: () => usersService.listPlatform(), // We'll add this method
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["platform-users"] });

  const createUser = useMutation({
    mutationFn: () => usersService.createPlatform(form),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setForm({ name: "", email: "", role: "admin" });
      toast.success("User created successfully");
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "Active" | "Blocked" }) =>
      usersService.setPlatformStatus(id, status),
    onSuccess: (updated) => {
      invalidate();
      toast.success(`User ${updated.status === "Blocked" ? "blocked" : "unblocked"}`);
    },
  });

  const columns: Column<PlatformUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => <span className="font-medium">{u.name}</span>,
      sortValue: (u) => u.name,
    },
    {
      key: "email",
      header: "Email",
      className: "text-muted-foreground",
      sortValue: (u) => u.email,
    },
    {
      key: "role",
      header: "Role",
      render: (u) => <StatusBadge status={u.role === "super_admin" ? "Super Admin" : "Admin"} tone="info" />,
    },
    {
      key: "joinedAt",
      header: "Joined",
      render: (u) => formatDate(u.joinedAt),
      sortValue: (u) => u.joinedAt,
    },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (u) => (
        <Button
          variant={u.status === "Blocked" ? "default" : "destructive"}
          size="sm"
          onClick={() =>
            toggleStatus.mutate({
              id: u.id,
              status: u.status === "Blocked" ? "Active" : "Blocked",
            })
          }
        >
          {u.status === "Blocked" ? "Unblock" : "Block"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Users"
        description="Manage all admins and super admins across the platform"
        actions={
          <Button onClick={() => { setForm({ name: "", email: "", role: "admin" }); setOpen(true); }}>
            <Plus className="size-4 mr-2" />
            Add User
          </Button>
        }
        // icon={UsersRound}
      />

      {platformUsers.isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={platformUsers.data ?? []}
          columns={columns}
          rowKey={(u) => u.id}
          searchKeys={["name", "email"]}
          searchPlaceholder="Search platform users..."
        />
      )}

      {/* Add User Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Platform User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@platform.com"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(value: "admin" | "super_admin") => setForm({ ...form, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (Venue Level)</SelectItem>
                  <SelectItem value="super_admin">Super Admin (Platform)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createUser.mutate()} disabled={!form.name || !form.email}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}