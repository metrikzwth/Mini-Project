import { useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getData, setData, STORAGE_KEYS, Medicine } from "@/lib/data";
import { Plus, Pencil, Trash2, Pill } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminMedicines = () => {
  const [medicines, setMedicines] = useState<Medicine[]>(
    getData(STORAGE_KEYS.MEDICINES, []),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    stock: "",
    timing: "after_food" as Medicine["instructions"]["timing"],
    drinkWith: "",
    dosageTiming: "",
  });

  const resetForm = () =>
    setForm({
      name: "",
      category: "",
      price: "",
      description: "",
      stock: "",
      timing: "after_food",
      drinkWith: "",
      dosageTiming: "",
    });

  const handleSave = () => {
    const med: Medicine = {
      id: editing?.id || `M${Date.now()}`,
      name: form.name,
      category: form.category,
      price: parseFloat(form.price) || 0,
      description: form.description,
      stock: parseInt(form.stock) || 0,
      image: "/placeholder.svg",
      instructions: {
        timing: form.timing,
        drinkWith: form.drinkWith,
        dosageTiming: form.dosageTiming,
        foodsToAvoid: [],
        precautions: [],
      },
    };
    const updated = editing
      ? medicines.map((m) => (m.id === med.id ? med : m))
      : [...medicines, med];
    setMedicines(updated);
    setData(STORAGE_KEYS.MEDICINES, updated);
    setIsOpen(false);
    setEditing(null);
    resetForm();
    toast.success(editing ? "Medicine updated!" : "Medicine added!");
  };

  const handleDelete = (id: string) => {
    const updated = medicines.filter((m) => m.id !== id);
    setMedicines(updated);
    setData(STORAGE_KEYS.MEDICINES, updated);
    toast.success("Medicine deleted!");
  };

  const openEdit = (m: Medicine) => {
    setEditing(m);
    setForm({
      name: m.name,
      category: m.category,
      price: m.price.toString(),
      description: m.description,
      stock: m.stock.toString(),
      timing: m.instructions.timing,
      drinkWith: m.instructions.drinkWith,
      dosageTiming: m.instructions.dosageTiming,
    });
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background m-5">
      <AdminSidebar />
      <main className={cn("transition-all pt-16 lg:pt-0 lg:pl-64", "p-8")}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Medicines</h1>
          <Button
            onClick={() => {
              resetForm();
              setEditing(null);
              setIsOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Medicine
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicines.map((m) => (
            <Card key={m.id} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Pill className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{m.name}</h3>
                      <Badge variant="outline">{m.category}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(m)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {m.description}
                </p>
                <div className="flex justify-between text-sm">
                  <span>Price: ${m.price}</span>
                  <span>Stock: {m.stock}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Medicine</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>When to Take</Label>
                <Select
                  value={form.timing}
                  onValueChange={(v) => setForm({ ...form, timing: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="before_food">Before Food</SelectItem>
                    <SelectItem value="after_food">After Food</SelectItem>
                    <SelectItem value="with_food">With Food</SelectItem>
                    <SelectItem value="anytime">Anytime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Drink With</Label>
                <Input
                  value={form.drinkWith}
                  onChange={(e) =>
                    setForm({ ...form, drinkWith: e.target.value })
                  }
                  placeholder="Water, Milk, etc."
                />
              </div>
              <div>
                <Label>Dosage Timing</Label>
                <Input
                  value={form.dosageTiming}
                  onChange={(e) =>
                    setForm({ ...form, dosageTiming: e.target.value })
                  }
                  placeholder="Every 8 hours"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminMedicines;
