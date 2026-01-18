import { useState } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getData, setData, STORAGE_KEYS, Doctor } from '@/lib/data';
import { Plus, Pencil, User, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>(getData(STORAGE_KEYS.DOCTORS, []));
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ name: '', specialization: '', experience: '', fee: '' });

  const handleSave = () => {
    const doc: Doctor = {
      id: editing?.id || `D${Date.now()}`, name: form.name, specialization: form.specialization,
      experience: parseInt(form.experience) || 0, fee: parseFloat(form.fee) || 0,
      rating: editing?.rating || 4.5, availability: editing?.availability || ['Monday', 'Wednesday', 'Friday'],
      image: '/placeholder.svg', isActive: true
    };
    const updated = editing ? doctors.map(d => d.id === doc.id ? doc : d) : [...doctors, doc];
    setDoctors(updated);
    setData(STORAGE_KEYS.DOCTORS, updated);
    setIsOpen(false);
    setEditing(null);
    toast.success(editing ? 'Doctor updated!' : 'Doctor added!');
  };

  const toggleActive = (id: string) => {
    const updated = doctors.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d);
    setDoctors(updated);
    setData(STORAGE_KEYS.DOCTORS, updated);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className={cn("transition-all pt-16 lg:pt-0 lg:pl-64", "p-8")}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Doctors</h1>
          <Button onClick={() => { setForm({ name: '', specialization: '', experience: '', fee: '' }); setEditing(null); setIsOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Add Doctor</Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(d => (
            <Card key={d.id} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center"><User className="w-6 h-6 text-secondary" /></div>
                    <div>
                      <h3 className="font-semibold">{d.name}</h3>
                      <p className="text-sm text-muted-foreground">{d.specialization}</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(d); setForm({ name: d.name, specialization: d.specialization, experience: d.experience.toString(), fee: d.fee.toString() }); setIsOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                </div>
                <div className="flex items-center gap-2 mb-3"><Star className="w-4 h-4 text-warning fill-warning" /><span className="text-sm">{d.rating}</span><span className="text-muted-foreground text-sm">• {d.experience} yrs</span></div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-primary">${d.fee}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{d.isActive ? 'Active' : 'Inactive'}</span>
                    <Switch checked={d.isActive} onCheckedChange={() => toggleActive(d.id)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-card">
            <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Doctor</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Specialization</Label><Input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Experience (years)</Label><Input type="number" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} /></div>
                <div><Label>Fee ($)</Label><Input type="number" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleSave}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDoctors;
