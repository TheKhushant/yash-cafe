import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgePercent,
  Ban,
  CalendarClock,
  Copy,
  Gift,
  MoreHorizontal,
  Plus,
  Send,
  Tags,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { assignedOffersService } from "@/lib/api/services/assigned-offers";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { KpiCard } from "@/components/shared/KpiCard";
import { KpiSkeleton, TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { offersService, type OfferInput } from "@/lib/api/services/offers";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Offer, OfferActivationType, OfferStatus, OfferType } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const OFFER_TYPES: OfferType[] = [
  "Coupon Code",
  "Starter",
  "Main Course",
  "Dessert",
  "Drinks",
  "Combo",
  "Flat Discount",
  "Percentage Discount",
  "Buy One Get One",
  "Free Item",
  "Cashback",
  "Custom",
];

const ACTIVATION_TYPES: { value: OfferActivationType; label: string; hint: string }[] = [
  { value: "Immediate", label: "Immediately after assignment", hint: "Timer starts the moment the offer is assigned to a customer." },
  { value: "OnQrScan", label: "After QR scan", hint: "Timer starts only once the customer scans the offer QR code." },
  { value: "Manual", label: "Manual activation", hint: "Timer starts only when staff manually activate it for a customer." },
];

const ACTIVATION_LABEL: Record<OfferActivationType, string> = {
  Immediate: "On assignment",
  OnQrScan: "On QR scan",
  Manual: "Manual activation",
};

const DURATION_PRESETS = [
  { label: "30 Minutes", value: 30 },
  { label: "1 Hour", value: 60 },
  { label: "2 Hours", value: 120 },
  { label: "6 Hours", value: 360 },
  { label: "12 Hours", value: 720 },
  { label: "1 Day", value: 1440 },
  { label: "3 Days", value: 4320 },
  { label: "7 Days", value: 10080 },
  { label: "Custom Duration", value: -1 },
];

function durationLabel(minutes: number): string {
  const preset = DURATION_PRESETS.find((d) => d.value === minutes);
  if (preset) return preset.label;
  if (minutes % 1440 === 0) return `${minutes / 1440} Day${minutes / 1440 > 1 ? "s" : ""}`;
  if (minutes % 60 === 0) return `${minutes / 60} Hour${minutes / 60 > 1 ? "s" : ""}`;
  return `${minutes} Minutes`;
}

function offerStatus(o: Offer): OfferStatus {
  if (!o.enabled) return "Disabled";
  if (new Date(o.endDate).getTime() < Date.now()) return "Expired";
  return "Active";
}

function benefitSummary(o: Offer): string {
  switch (o.type) {
    case "Flat Discount":
      return `${formatCurrency(o.discountValue ?? 0)} off`;
    case "Percentage Discount":
      return `${o.discountValue ?? 0}% off`;
    case "Cashback":
      return `${formatCurrency(o.discountValue ?? 0)} cashback`;
    case "Free Item":
      return `Free ${o.freeItemName || "item"}`;
    case "Coupon Code":
      return o.code ? `Code: ${o.code}` : "Coupon";
    default:
      return o.benefitDetails || o.type;
  }
}

function needsDiscountValue(type: OfferType) {
  return type === "Flat Discount" || type === "Percentage Discount" || type === "Cashback";
}
function needsFreeItem(type: OfferType) {
  return type === "Free Item";
}
function needsBenefitDetails(type: OfferType) {
  return [
    "Combo",
    "Buy One Get One",
    "Starter",
    "Main Course",
    "Dessert",
    "Drinks",
    "Custom",
  ].includes(type);
}

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}
function fromDateInput(value: string, endOfDay: boolean): string {
  const d = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return d.toISOString();
}

interface FormState {
  name: string;
  code: string;
  description: string;
  type: OfferType;
  discountValue: string;
  freeItemName: string;
  benefitDetails: string;
  activationType: OfferActivationType;
  startDate: string;
  endDate: string;
  durationPreset: number;
  customMinutes: string;
  unlimited: boolean;
  maxAssignments: string;
  perCustomerLimit: string;
  maxRedemptions: string;
  enabled: boolean;
}

const TODAY = new Date().toISOString().slice(0, 10);
const IN_30_DAYS = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

const EMPTY_FORM: FormState = {
  name: "",
  code: "",
  description: "",
  type: "Flat Discount",
  discountValue: "",
  freeItemName: "",
  benefitDetails: "",
  activationType: "Immediate",
  startDate: TODAY,
  endDate: IN_30_DAYS,
  durationPreset: 1440,
  customMinutes: "",
  unlimited: false,
  maxAssignments: "100",
  perCustomerLimit: "1",
  maxRedemptions: "100",
  enabled: true,
};

function offerToForm(o: Offer): FormState {
  const preset = DURATION_PRESETS.find((d) => d.value === o.expiryDurationMinutes);
  return {
    name: o.name,
    code: o.code ?? "",
    description: o.description ?? "",
    type: o.type,
    discountValue: o.discountValue != null ? String(o.discountValue) : "",
    freeItemName: o.freeItemName ?? "",
    benefitDetails: o.benefitDetails ?? "",
    activationType: o.activationType,
    startDate: toDateInput(o.startDate),
    endDate: toDateInput(o.endDate),
    durationPreset: preset ? preset.value : -1,
    customMinutes: preset ? "" : String(o.expiryDurationMinutes),
    unlimited: o.maxAssignments === null && o.maxRedemptions === null,
    maxAssignments: o.maxAssignments != null ? String(o.maxAssignments) : "",
    perCustomerLimit: o.perCustomerLimit != null ? String(o.perCustomerLimit) : "",
    maxRedemptions: o.maxRedemptions != null ? String(o.maxRedemptions) : "",
    enabled: o.enabled,
  };
}

function formToInput(form: FormState): OfferInput {
  const expiryDurationMinutes =
    form.durationPreset === -1 ? Number(form.customMinutes) || 60 : form.durationPreset;

  return {
    name: form.name.trim(),
    code: form.code.trim() || undefined,
    description: form.description.trim() || undefined,
    type: form.type,
    discountValue: needsDiscountValue(form.type) ? Number(form.discountValue) || 0 : undefined,
    freeItemName: needsFreeItem(form.type) ? form.freeItemName.trim() : undefined,
    benefitDetails: needsBenefitDetails(form.type) ? form.benefitDetails.trim() : undefined,
    activationType: form.activationType,
    startDate: fromDateInput(form.startDate, false),
    endDate: fromDateInput(form.endDate, true),
    expiryDurationMinutes,
    maxAssignments: form.unlimited ? null : Number(form.maxAssignments) || 0,
    perCustomerLimit: Number(form.perCustomerLimit) || 1,
    maxRedemptions: form.unlimited ? null : Number(form.maxRedemptions) || 0,
    enabled: form.enabled,
  };
}

export default function OffersPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [viewing, setViewing] = useState<Offer | null>(null);
  const [toDelete, setToDelete] = useState<Offer | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const offers = useQuery({
    queryKey: ["offers", scope],
    queryFn: () => offersService.list(scope),
  });

  const assignedUsers = useQuery({
    queryKey: ["offer-assigned-users", viewing?.id],
    queryFn: () => assignedOffersService.listForOffer(viewing!.id),
    enabled: !!viewing,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["offers"] });

  const save = useMutation({
    mutationFn: () =>
      editing
        ? offersService.update(editing.id, formToInput(form))
        : offersService.create(formToInput(form), scope),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success(editing ? "Offer updated" : "Offer created");
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      offersService.update(id, { enabled }),
    onSuccess: () => invalidate(),
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => offersService.duplicate(id),
    onSuccess: () => {
      invalidate();
      toast.success("Offer duplicated");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => offersService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Offer deleted");
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }
  function openEdit(o: Offer) {
    setEditing(o);
    setForm(offerToForm(o));
    setOpen(true);
  }

  const allOffers = offers.data ?? [];

  const filtered = useMemo(() => {
    return allOffers.filter((o) => {
      if (typeFilter !== "all" && o.type !== typeFilter) return false;
      if (statusFilter !== "all" && offerStatus(o) !== statusFilter) return false;
      return true;
    });
  }, [allOffers, typeFilter, statusFilter]);

  const summary = useMemo(() => {
    let active = 0;
    let disabled = 0;
    let expired = 0;
    let assigned = 0;
    let redeemed = 0;
    for (const o of allOffers) {
      const s = offerStatus(o);
      if (s === "Active") active++;
      else if (s === "Disabled") disabled++;
      else expired++;
      assigned += o.assignedCount;
      redeemed += o.redeemedCount;
    }
    return { total: allOffers.length, active, disabled, expired, assigned, redeemed };
  }, [allOffers]);

  const columns: Column<Offer>[] = [
    {
      key: "name",
      header: "Offer",
      render: (o) => (
        <div>
          <div className="font-medium text-foreground">{o.name}</div>
          <div className="text-xs text-muted-foreground">
            {o.code ? `Code: ${o.code}` : o.type}
          </div>
        </div>
      ),
      sortValue: (o) => o.name,
    },
    { key: "type", header: "Type", render: (o) => <span className="text-sm">{o.type}</span>, sortValue: (o) => o.type },
    { key: "benefit", header: "Discount / Benefit", render: (o) => <span className="text-sm">{benefitSummary(o)}</span> },
    {
      key: "status",
      header: "Status",
      render: (o) => {
        const s = offerStatus(o);
        return <StatusBadge status={s} tone={s === "Disabled" ? "warning" : undefined} />;
      },
      sortValue: (o) => offerStatus(o),
    },
    { key: "assignedCount", header: "Assigned", render: (o) => o.assignedCount, sortValue: (o) => o.assignedCount },
    { key: "redeemedCount", header: "Redeemed", render: (o) => o.redeemedCount, sortValue: (o) => o.redeemedCount },
    {
      key: "expiry",
      header: "Expiry Rule",
      render: (o) => (
        <span className="text-xs text-muted-foreground">
          {ACTIVATION_LABEL[o.activationType]} • {durationLabel(o.expiryDurationMinutes)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (o) => formatDate(o.createdAt),
      sortValue: (o) => o.createdAt,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (o) => (
        <div className="flex items-center justify-end gap-1">
          <Switch
            checked={o.enabled}
            onCheckedChange={(v) => toggle.mutate({ id: o.id, enabled: v })}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewing(o)}>View details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEdit(o)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicate.mutate(o.id)}>
                <Copy className="size-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setToDelete(o)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers"
        description="Create and manage promotional offers for your customers."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New Offer
          </Button>
        }
      />

      {offers.isLoading ? (
        <KpiSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <KpiCard label="Total Offers" value={String(summary.total)} icon={Tags} tone="primary" hint="all offers" />
          <KpiCard label="Active Offers" value={String(summary.active)} icon={Send} tone="success" hint="currently live" />
          <KpiCard label="Disabled Offers" value={String(summary.disabled)} icon={Ban} tone="warning" hint="turned off" />
          <KpiCard label="Expired Offers" value={String(summary.expired)} icon={CalendarClock} tone="danger" hint="past end date" />
          <KpiCard label="Assigned" value={String(summary.assigned)} icon={Ticket} tone="info" hint="times assigned" />
          <KpiCard label="Redeemed" value={String(summary.redeemed)} icon={Gift} tone="success" hint="times redeemed" />
        </div>
      )}

      {offers.isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(o) => o.id}
          searchKeys={["name", "code"]}
          searchPlaceholder="Search offers…"
          toolbar={
            <>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {OFFER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
        />
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Offer" : "Create Offer"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Offer Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Weekend Combo Deal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Offer Code {form.type === "Coupon Code" ? "" : "(optional)"}</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Short description shown to customers"
                />
              </div>
              <div className="space-y-2">
                <Label>Offer Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as OfferType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OFFER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic Discount / Benefit Configuration */}
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BadgePercent className="size-4" /> Discount / Benefit Configuration
              </h3>
              {needsDiscountValue(form.type) && (
                <div className="space-y-2">
                  <Label>
                    {form.type === "Percentage Discount" ? "Discount Percentage (%)" : "Amount"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.type === "Percentage Discount" ? "20" : "10"}
                  />
                </div>
              )}
              {needsFreeItem(form.type) && (
                <div className="space-y-2">
                  <Label>Free Item</Label>
                  <Input
                    value={form.freeItemName}
                    onChange={(e) => setForm({ ...form, freeItemName: e.target.value })}
                    placeholder="Loaded Nachos"
                  />
                </div>
              )}
              {needsBenefitDetails(form.type) && (
                <div className="space-y-2">
                  <Label>Benefit Details</Label>
                  <Textarea
                    value={form.benefitDetails}
                    onChange={(e) => setForm({ ...form, benefitDetails: e.target.value })}
                    rows={3}
                    placeholder="Describe what the customer gets"
                  />
                </div>
              )}
              {form.type === "Coupon Code" && (
                <p className="text-xs text-muted-foreground">
                  Customers redeem this offer using the offer code above.
                </p>
              )}
            </div>

            {/* Activation Rules */}
            <div className="space-y-2">
              <Label>Offer Activation</Label>
              <Select
                value={form.activationType}
                onValueChange={(v) => setForm({ ...form, activationType: v as OfferActivationType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVATION_TYPES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {ACTIVATION_TYPES.find((a) => a.value === form.activationType)?.hint}
                {" "}The expiry timer never starts at creation — only once this trigger occurs.
              </p>
            </div>

            {/* Validity */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Validity</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expiry Duration (after activation)</Label>
                <Select
                  value={String(form.durationPreset)}
                  onValueChange={(v) => setForm({ ...form, durationPreset: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATION_PRESETS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.durationPreset === -1 && (
                  <Input
                    type="number"
                    min={1}
                    className="mt-2"
                    value={form.customMinutes}
                    onChange={(e) => setForm({ ...form, customMinutes: e.target.value })}
                    placeholder="Custom duration in minutes"
                  />
                )}
              </div>
            </div>

            {/* Usage Limits */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Usage Limits</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Unlimited</Label>
                  <Switch
                    checked={form.unlimited}
                    onCheckedChange={(v) => setForm({ ...form, unlimited: v })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Max Assignments</Label>
                  <Input
                    type="number"
                    min={0}
                    disabled={form.unlimited}
                    value={form.unlimited ? "" : form.maxAssignments}
                    onChange={(e) => setForm({ ...form, maxAssignments: e.target.value })}
                    placeholder={form.unlimited ? "Unlimited" : "100"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per Customer Limit</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.perCustomerLimit}
                    onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Redemptions</Label>
                  <Input
                    type="number"
                    min={0}
                    disabled={form.unlimited}
                    value={form.unlimited ? "" : form.maxRedemptions}
                    onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                    placeholder={form.unlimited ? "Unlimited" : "100"}
                  />
                </div>
              </div>
            </div>

            {/* Enable/Disable */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Offer Enabled</p>
                <p className="text-xs text-muted-foreground">Disabled offers cannot be assigned to customers.</p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => setForm({ ...form, enabled: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => save.mutate()}
              disabled={
                !form.name ||
                (form.type === "Coupon Code" && !form.code) ||
                save.isPending
              }
            >
              {save.isPending ? "Saving..." : editing ? "Save Changes" : "Create Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={offerStatus(viewing)}
                  tone={offerStatus(viewing) === "Disabled" ? "warning" : undefined}
                />
                <span className="text-muted-foreground">{viewing.type}</span>
              </div>
              {viewing.description && <p className="text-muted-foreground">{viewing.description}</p>}
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
                <div><p className="text-xs text-muted-foreground">Benefit</p><p className="font-medium">{benefitSummary(viewing)}</p></div>
                <div><p className="text-xs text-muted-foreground">Offer Code</p><p className="font-medium">{viewing.code ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Activation</p><p className="font-medium">{ACTIVATION_LABEL[viewing.activationType]}</p></div>
                <div><p className="text-xs text-muted-foreground">Expiry Duration</p><p className="font-medium">{durationLabel(viewing.expiryDurationMinutes)}</p></div>
                <div><p className="text-xs text-muted-foreground">Valid From</p><p className="font-medium">{formatDate(viewing.startDate)}</p></div>
                <div><p className="text-xs text-muted-foreground">Valid Until</p><p className="font-medium">{formatDate(viewing.endDate)}</p></div>
                <div><p className="text-xs text-muted-foreground">Max Assignments</p><p className="font-medium">{viewing.maxAssignments ?? "Unlimited"}</p></div>
                <div><p className="text-xs text-muted-foreground">Per Customer Limit</p><p className="font-medium">{viewing.perCustomerLimit ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Max Redemptions</p><p className="font-medium">{viewing.maxRedemptions ?? "Unlimited"}</p></div>
                <div><p className="text-xs text-muted-foreground">Created</p><p className="font-medium">{formatDate(viewing.createdAt)}</p></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{viewing.assignedCount}</p>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{viewing.redeemedCount}</p>
                  <p className="text-xs text-muted-foreground">Redeemed</p>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">Assigned Users</h4>
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {assignedUsers.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : (assignedUsers.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      This offer hasn't been assigned to any customer yet.
                    </p>
                  ) : (
                    assignedUsers.data!.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div>
                          <p className="font-medium text-foreground">{a.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            Assigned {formatDate(a.assignedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Expires {formatDate(a.expiryDate)}
                          </span>
                          <StatusBadge status={a.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete offer?"
        description={`"${toDelete?.name}" will be permanently removed.`}
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