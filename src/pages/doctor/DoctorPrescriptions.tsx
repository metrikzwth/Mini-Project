import { useState, useEffect } from 'react';
import DoctorNavbar from '@/components/layout/DoctorNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getData, setData, STORAGE_KEYS, Prescription, User, hideItemForUser, getHiddenItems, clearHiddenItems } from '@/lib/data';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DoctorPrescriptions = () => {
  const { user } = useAuth();
  const patients = getData<User[]>(STORAGE_KEYS.USERS, []).filter(u => u.role === 'patient');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    if (user) {
      const hiddenIds = getHiddenItems(STORAGE_KEYS.HIDDEN_PRESCRIPTIONS, user.id);
      const allRx = getData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, []);
      setPrescriptions(allRx.filter(p => (p.doctorId === user.id || p.doctorName === user.name) && !hiddenIds.includes(p.id)));
    }
  }, [user]);

  const [form, setForm] = useState({ patientId: '', diagnosis: '', notes: '', medicines: [{ name: '', dosage: '', duration: '', instructions: '' }] });

  const addMedicine = () => setForm({ ...form, medicines: [...form.medicines, { name: '', dosage: '', duration: '', instructions: '' }] });
  const removeMedicine = (i: number) => setForm({ ...form, medicines: form.medicines.filter((_, idx) => idx !== i) });
  const updateMedicine = (i: number, field: string, value: string) => {
    const meds = [...form.medicines];
    meds[i] = { ...meds[i], [field]: value };
    setForm({ ...form, medicines: meds });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === form.patientId);
    if (!patient || !form.diagnosis) { toast.error('Fill all fields'); return; }

    const newRx: Prescription = {
      id: `RX${Date.now()}`, patientId: form.patientId, patientName: patient.name,
      doctorId: user?.id || '', doctorName: user?.name || '',
      date: new Date().toISOString().split('T')[0],
      consultationTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      diagnosis: form.diagnosis,
      medicines: form.medicines.filter(m => m.name), notes: form.notes
    };

    const all = getData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, []);
    all.push(newRx);
    setData(STORAGE_KEYS.PRESCRIPTIONS, all);
    setPrescriptions([newRx, ...prescriptions]);
    setForm({ patientId: '', diagnosis: '', notes: '', medicines: [{ name: '', dosage: '', duration: '', instructions: '' }] });
    toast.success('Prescription created!');
  };

  const handleDeletePrescription = (rxId: string) => {
    if (!confirm('Are you sure you want to remove this prescription from your list?')) return;
    hideItemForUser(STORAGE_KEYS.HIDDEN_PRESCRIPTIONS, user?.id || '', rxId);
    setPrescriptions(prev => prev.filter(r => r.id !== rxId));
    toast.success('Prescription removed from your list');
  };

  return (
    <div className="min-h-screen bg-background">
      <DoctorNavbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Prescriptions</h1>
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-2">
            <CardHeader><CardTitle>Create Prescription</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Patient</Label>
                  <Select value={form.patientId} onValueChange={v => setForm({ ...form, patientId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent className="bg-popover">{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Diagnosis</Label><Input value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} /></div>
                <div>
                  <Label>Medicines</Label>
                  {form.medicines.map((med, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 mt-2">
                      <Input placeholder="Name" value={med.name} onChange={e => updateMedicine(i, 'name', e.target.value)} />
                      <Input placeholder="Dosage" value={med.dosage} onChange={e => updateMedicine(i, 'dosage', e.target.value)} />
                      <Input placeholder="Duration" value={med.duration} onChange={e => updateMedicine(i, 'duration', e.target.value)} />
                      <Input placeholder="Instructions" value={med.instructions} onChange={e => updateMedicine(i, 'instructions', e.target.value)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMedicine(i)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addMedicine}><Plus className="w-4 h-4 mr-1" /> Add Medicine</Button>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <Button type="submit" className="w-full">Create Prescription</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader><CardTitle>Recent Prescriptions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {prescriptions.slice(0, 5).map(rx => (
                <div key={rx.id} className="p-4 bg-muted rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{rx.patientName}</p>
                    <p className="text-sm text-muted-foreground">{rx.diagnosis} • {rx.date}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePrescription(rx.id)}
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                    title="Delete prescription"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {prescriptions.length === 0 && <p className="text-center py-8 text-muted-foreground">No prescriptions yet</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DoctorPrescriptions;
