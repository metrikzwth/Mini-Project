import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PatientNavbar from '@/components/layout/PatientNavbar';
import MedicineChatbot from '@/components/chatbot/MedicineChatbot';
import { getData, STORAGE_KEYS, Appointment, Order } from '@/lib/data';
import { 
  Pill, 
  Calendar, 
  Video, 
  FileText, 
  Package, 
  Clock,
  ArrowRight,
  Heart,
  Activity
} from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuth();
  const appointments = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, [])
    .filter(a => a.patientId === user?.id && a.status !== 'cancelled');
  const orders = getData<Order[]>(STORAGE_KEYS.ORDERS, [])
    .filter(o => o.patientId === user?.id);

  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

  const quickActions = [
    { icon: Pill, label: 'Order Medicines', path: '/patient/medicines', color: 'bg-primary' },
    { icon: Calendar, label: 'Book Appointment', path: '/patient/appointments', color: 'bg-secondary' },
    { icon: Video, label: 'Video Consult', path: '/patient/consultation', color: 'bg-accent' },
    { icon: FileText, label: 'View History', path: '/patient/history', color: 'bg-info' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PatientNavbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Your health journey at a glance. What would you like to do today?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={action.path}>
                <Card className="card-hover border-2 h-full">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground">{action.label}</h3>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Appointments
                </CardTitle>
                <CardDescription>Your scheduled consultations</CardDescription>
              </div>
              <Link to="/patient/appointments">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Video className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{apt.doctorName}</p>
                          <p className="text-sm text-muted-foreground">{apt.date} at {apt.time}</p>
                        </div>
                      </div>
                      <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                  <Link to="/patient/appointments">
                    <Button variant="outline" className="mt-4">
                      Book an Appointment
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-secondary" />
                  Active Orders
                </CardTitle>
                <CardDescription>Track your medicine deliveries</CardDescription>
              </div>
              <Link to="/patient/history">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeOrders.length > 0 ? (
                <div className="space-y-4">
                  {activeOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Order #{order.id.slice(-6)}</p>
                          <p className="text-sm text-muted-foreground">{order.items.length} items • ${order.total.toFixed(2)}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No active orders</p>
                  <Link to="/patient/medicines">
                    <Button variant="outline" className="mt-4">
                      Browse Medicines
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Health Tips */}
        <Card className="border-2 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-destructive" />
              Health Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Activity className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-1">Stay Active</h4>
                <p className="text-sm text-muted-foreground">30 minutes of daily exercise can improve your overall health</p>
              </div>
              <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                <Clock className="w-8 h-8 text-secondary mb-3" />
                <h4 className="font-semibold text-foreground mb-1">Take Medicines On Time</h4>
                <p className="text-sm text-muted-foreground">Set reminders to never miss your medication schedule</p>
              </div>
              <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                <Heart className="w-8 h-8 text-accent mb-3" />
                <h4 className="font-semibold text-foreground mb-1">Regular Check-ups</h4>
                <p className="text-sm text-muted-foreground">Schedule regular consultations with your doctor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <MedicineChatbot />
    </div>
  );
};

export default PatientDashboard;
