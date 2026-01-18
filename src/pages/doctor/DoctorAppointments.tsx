import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DoctorNavbar from '@/components/layout/DoctorNavbar';
import { useAuth } from '@/contexts/AuthContext';
import { getData, setData, STORAGE_KEYS, Appointment } from '@/lib/data';
import { Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>(
    getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []).filter(a => a.doctorName === user?.name)
  );

  const updateStatus = (id: string, status: Appointment['status']) => {
    const allApts = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const updated = allApts.map(a => a.id === id ? { ...a, status } : a);
    setData(STORAGE_KEYS.APPOINTMENTS, updated);
    setAppointments(updated.filter(a => a.doctorName === user?.name));
    toast.success(`Appointment ${status}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <DoctorNavbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Appointments</h1>
        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id} className="border-2">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{apt.patientName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {apt.date} <Clock className="w-4 h-4" /> {apt.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{apt.status}</Badge>
                  {apt.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(apt.id, 'confirmed')}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Confirm
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(apt.id, 'cancelled')}>
                        <XCircle className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {appointments.length === 0 && (
            <p className="text-center py-16 text-muted-foreground">No appointments scheduled</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorAppointments;
