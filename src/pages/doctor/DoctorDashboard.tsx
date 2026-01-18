import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DoctorNavbar from '@/components/layout/DoctorNavbar';
import { getData, STORAGE_KEYS, Appointment } from '@/lib/data';
import { Calendar, Video, FileText, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const appointments = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, [])
    .filter(a => a.doctorName === user?.name);

  const todayAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const completedToday = appointments.filter(a => a.status === 'completed').length;

  const stats = [
    { label: 'Today\'s Appointments', value: todayAppointments.length, icon: Calendar, color: 'bg-primary' },
    { label: 'Completed', value: completedToday, icon: FileText, color: 'bg-secondary' },
    { label: 'Total Patients', value: new Set(appointments.map(a => a.patientId)).size, icon: Users, color: 'bg-accent' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DoctorNavbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome, {user?.name}! 👋</h1>
        <p className="text-muted-foreground mb-8">Here's your schedule overview</p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
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

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{apt.patientName}</p>
                      <p className="text-sm text-muted-foreground">{apt.date} at {apt.time}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{apt.status}</Badge>
                      <Link to="/doctor/consultation">
                        <Video className="w-5 h-5 text-primary cursor-pointer" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No upcoming appointments</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DoctorDashboard;
