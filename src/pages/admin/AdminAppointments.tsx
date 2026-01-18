import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getData, STORAGE_KEYS, Appointment } from '@/lib/data';
import { Calendar, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminAppointments = () => {
  const appointments = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className={cn("transition-all pt-16 lg:pt-0 lg:pl-64", "p-8")}>
        <h1 className="text-3xl font-bold text-foreground mb-8">Appointments</h1>
        <div className="space-y-4">
          {appointments.map(a => (
            <Card key={a.id} className="border-2">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"><User className="w-6 h-6 text-primary" /></div>
                  <div>
                    <p className="font-semibold">{a.patientName} → {a.doctorName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> {a.date} <Clock className="w-4 h-4" /> {a.time}</p>
                  </div>
                </div>
                <Badge>{a.status}</Badge>
              </CardContent>
            </Card>
          ))}
          {appointments.length === 0 && <p className="text-center py-16 text-muted-foreground">No appointments yet</p>}
        </div>
      </main>
    </div>
  );
};

export default AdminAppointments;
