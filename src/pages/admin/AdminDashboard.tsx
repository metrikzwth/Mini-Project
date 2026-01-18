import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getData, STORAGE_KEYS, Medicine, Doctor, Order, Appointment } from '@/lib/data';
import { Pill, UserCog, Package, Calendar, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
  const medicines = getData<Medicine[]>(STORAGE_KEYS.MEDICINES, []);
  const doctors = getData<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
  const orders = getData<Order[]>(STORAGE_KEYS.ORDERS, []);
  const appointments = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);

  const stats = [
    { label: 'Total Medicines', value: medicines.length, icon: Pill, color: 'bg-primary' },
    { label: 'Active Doctors', value: doctors.filter(d => d.isActive).length, icon: UserCog, color: 'bg-secondary' },
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'bg-accent' },
    { label: 'Appointments', value: appointments.length, icon: Calendar, color: 'bg-info' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className={cn("transition-all pt-16 lg:pt-0 lg:pl-64", "p-8")}>
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">Overview of your healthcare platform</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="border-2">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Recent Orders</CardTitle></CardHeader>
            <CardContent>
              {orders.slice(0, 5).map(o => (
                <div key={o.id} className="flex justify-between py-3 border-b last:border-0">
                  <span className="text-foreground">{o.patientName}</span>
                  <span className="text-muted-foreground">${o.total.toFixed(2)}</span>
                </div>
              ))}
              {orders.length === 0 && <p className="text-center py-8 text-muted-foreground">No orders yet</p>}
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Recent Appointments</CardTitle></CardHeader>
            <CardContent>
              {appointments.slice(0, 5).map(a => (
                <div key={a.id} className="flex justify-between py-3 border-b last:border-0">
                  <span className="text-foreground">{a.patientName}</span>
                  <span className="text-muted-foreground">{a.doctorName}</span>
                </div>
              ))}
              {appointments.length === 0 && <p className="text-center py-8 text-muted-foreground">No appointments yet</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
