import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Heart, Utensils   } from "lucide-react";

import { toast } from "sonner";

import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MenuItemBadges } from "@/components/dietary/MenuItemBadges";
import { MenuItemDietaryFields } from "@/components/dietary/MenuItemDietaryFields";
import { RecommendDishDialog } from "@/components/dietary/RecommendDishDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { menuService, type MenuInput } from "@/lib/api/services/menu";
import { usersService } from "@/lib/api/services/users";
import { computeCompatibility } from "@/lib/dietary";
import { formatCurrencyPrecise } from "@/lib/format";
import type { DietaryTag, FoodType, MenuItem } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const FOOD_TYPES: FoodType[] = ["Veg", "Non Veg", "Vegan", "Jain", "Egg", "Seafood"];
const DIETARY_TAGS: DietaryTag[] = [
  "High Protein", "Low Carb", "Gluten Free", "Dairy Free", "Nut Free", "Sugar Free",
  "Keto", "Healthy", "Kids Friendly", "Chef Special", "Seasonal", "Popular",
];

const EMPTY: MenuInput = {
  name: "", category: "Mains", price: 0, stock: 0, enabled: true, description: "",
  foodType: [], ingredients: [], allergens: [], dietaryTags: [],
  containsAlcohol: false, spiceLevel: "No Spice", preparationTime: 15, servingSize: "1 Person",
};

export default function MenuPage() {
  const scope = useAuthStore((s) => s.venueScope)();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuInput>(EMPTY);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MenuItem | null>(null);
  const [recommending, setRecommending] = useState<MenuItem | null>(null);

  const [foodTypeFilter, setFoodTypeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [maxPrepTime, setMaxPrepTime] = useState("");
  const [maxCalories, setMaxCalories] = useState("");
  const [previewCustomerId, setPreviewCustomerId] = useState("");

  const items = useQuery({ queryKey: ["menu", scope], queryFn: () => menuService.list(scope) });
  const users = useQuery({ queryKey: ["users", scope], queryFn: () => usersService.list(scope) });
  const previewCustomer = (users.data ?? []).find((u) => u.id === previewCustomerId);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["menu"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const save = useMutation({
    mutationFn: () =>
      editing ? menuService.update(editing.id, form) : menuService.create(form, scope),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success(editing ? "Item updated" : "Item added");
    },
  });

  const patch = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) => menuService.update(id, data),
    onSuccess: () => invalidate(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => menuService.remove(id),
    onSuccess: () => { invalidate(); toast.success("Item deleted"); },
  });

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(m: MenuItem) {
    setEditing(m);
    setForm({
      name: m.name,
      category: m.category,
      price: m.price,
      stock: m.stock,
      enabled: m.enabled,
      description: m.description,
      outOfStock: m.outOfStock,
      image: m.image,
      isFavourite: m.isFavourite,
      isMostOrdered: m.isMostOrdered,
      foodType: m.foodType,
      ingredients: m.ingredients,
      allergens: m.allergens,
      dietaryTags: m.dietaryTags,
      nutrition: m.nutrition,
      containsAlcohol: m.containsAlcohol,
      spiceLevel: m.spiceLevel,
      preparationTime: m.preparationTime,
      servingSize: m.servingSize,
      chefNotes: m.chefNotes,
    });
    setOpen(true);
  }

  const filtered = useMemo(() => {
    const all = items.data ?? [];
    return all.filter((m) => {
      if (foodTypeFilter !== "all" && !m.foodType.includes(foodTypeFilter as FoodType)) return false;
      if (tagFilter !== "all" && !m.dietaryTags.includes(tagFilter as DietaryTag)) return false;
      if (maxPrepTime && m.preparationTime > Number(maxPrepTime)) return false;
      if (maxCalories && (m.nutrition?.calories ?? 0) > Number(maxCalories)) return false;
      return true;
    });
  }, [items.data, foodTypeFilter, tagFilter, maxPrepTime, maxCalories]);

  const columns: Column<MenuItem>[] = [
    { key: "name", header: "Item", render: (m) => <span className="font-medium text-foreground">{m.name}</span>, sortValue: (m) => m.name },
    { key: "category", header: "Category", sortValue: (m) => m.category },
    { key: "price", header: "Price", render: (m) => formatCurrencyPrecise(m.price), sortValue: (m) => m.price },
    { key: "stock", header: "Stock", render: (m) => <span className={m.stock <= 5 ? "text-warning-foreground" : ""}>{m.stock}</span>, sortValue: (m) => m.stock },
    {
      key: "tags",
      header: "Dietary Info",
      render: (m) => <MenuItemBadges item={m} compact />,
    },
    ...(previewCustomer ? [{
      key: "compatibility",
      header: "Compatibility",
      render: (m: MenuItem) => {
        const result = computeCompatibility(m, previewCustomer.dietaryPreferences);
        return (
          <span className={
            result.cardTone === "green" ? "text-success font-medium" :
            result.cardTone === "yellow" ? "text-warning-foreground font-medium" :
            result.cardTone === "orange" ? "text-orange-600 font-medium" : "text-destructive font-medium"
          }>
            {result.score}% · {result.level}
          </span>
        );
      },
    } as Column<MenuItem>] : []),
    {
      key: "status", header: "Availability",
      render: (m) => (m.outOfStock ? <StatusBadge status="Out of Stock" tone="danger" /> : m.enabled ? <StatusBadge status="Available" tone="success" /> : <StatusBadge status="Disabled" tone="neutral" />),
    },
    {
      key: "actions", header: "", headerClassName: "text-right", className: "text-right",
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <Switch checked={!m.outOfStock} onCheckedChange={(v) => patch.mutate({ id: m.id, data: { outOfStock: !v } })} title="In stock" />
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setRecommending(m)} title="Recommend to customer">
            <Utensils  className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(m)}><Pencil className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => setToDelete(m)}><Trash2 className="size-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu & Inventory"
        description="Manage items, pricing, stock, and dietary/allergen information."
        actions={<Button onClick={openCreate}><Plus className="size-4" />Add Item</Button>}
      />

      {items.isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          rowKey={(m) => m.id}
          searchKeys={["name", "category"]}
          searchPlaceholder="Search menu…"
          toolbar={
            <>
              <Select value={foodTypeFilter} onValueChange={setFoodTypeFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Diet" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Diets</SelectItem>
                  {FOOD_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Dietary Tag" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {DIETARY_TAGS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                type="number" min={0} placeholder="Max prep (min)" value={maxPrepTime}
                onChange={(e) => setMaxPrepTime(e.target.value)} className="w-[130px]"
              />
              <Input
                type="number" min={0} placeholder="Max calories" value={maxCalories}
                onChange={(e) => setMaxCalories(e.target.value)} className="w-[130px]"
              />
              <Select value={previewCustomerId || "__none"} onValueChange={(v) => setPreviewCustomerId(v === "__none" ? "" : v)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Preview as customer…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No preview</SelectItem>
                  {(users.data ?? []).filter((u) => u.role === "user" && u.status === "Active").map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Item" : "Add Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">

            {/* Name */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stock: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Image</Label>

              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();

                  reader.onloadend = () => {
                    setForm({
                      ...form,
                      image: reader.result as string,
                    });
                  };

                  reader.readAsDataURL(file);
                }}
              />

              {form.image && (
                <img
                  src={form.image}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg border object-cover"
                />
              )}
            </div>

            {/* Enabled */}
            <div className="flex items-center justify-between rounded-lg border px-3 py-3">
              <Label>Enabled</Label>
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) =>
                  setForm({ ...form, enabled: v })
                }
              />
            </div>

            {/* Customer Favourite */}
            <div className="flex items-center justify-between rounded-lg border px-3 py-3">
              <div className="flex items-center gap-2">
                <Label>Customer Favourite</Label>

                <Heart
                  className={`h-5 w-5 transition-colors ${
                    form.isFavourite
                      ? "fill-red-500 text-red-500"
                      : "fill-transparent text-red-800"
                  }`}
                />
              </div>

              <Switch
                checked={form.isFavourite}
                onCheckedChange={(v) =>
                  setForm({
                    ...form,
                    isFavourite: v,
                  })
                }
              />
            </div>

            {/* Most Ordered */}
            <div className="flex items-center justify-between rounded-lg border px-3 py-3 sm:col-span-2">
              <Label>Most Ordered Dish</Label>
              <Switch
                checked={form.isMostOrdered}
                onCheckedChange={(v) =>
                  setForm({
                    ...form,
                    isMostOrdered: v,
                  })
                }
              />
            </div>

            {/* Food Classification, Ingredients, Allergens, Spice, Nutrition, Dietary Tags, Alcohol, Chef Notes */}
            <div className="sm:col-span-2 border-t pt-4">
              <MenuItemDietaryFields form={form} onChange={(p) => setForm({ ...form, ...p })} />
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={() => save.mutate()}
              disabled={!form.name || save.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete item?"
        description={`"${toDelete?.name}" will be permanently removed.`}
        destructive
        confirmLabel="Delete"
        onConfirm={() => { if (toDelete) remove.mutate(toDelete.id); setToDelete(null); }}
      />

      <RecommendDishDialog item={recommending} onOpenChange={(o) => !o && setRecommending(null)} />
    </div>
  );
}