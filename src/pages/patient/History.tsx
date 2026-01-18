import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import PatientNavbar from '@/components/layout/PatientNavbar';
import MedicineChatbot from '@/components/chatbot/MedicineChatbot';
import { useAuth } from '@/contexts/AuthContext';
import { getData, STORAGE_KEYS, Order, Prescription, Appointment } from '@/lib/data';
import { 
  Package, 
  FileText, 
  Calendar,
  Clock,
  MapPin,
  Pill,
  User
} from 'lucide-react';

const History = () => {
  const { user } = useAuth();
  
  const orders = getData<Order[]>(STORAGE_KEYS.ORDERS, [])
    .filter(o => o.patientId === user?.id)
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    
  const prescriptions = getData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, [])
    .filter(p => p.patientId === user?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
  const appointments = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, [])
    .filter(a => a.patientId === user?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const statusColors = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    processing: 'bg-info/10 text-info border-info/20',
    shipped: 'bg-primary/10 text-primary border-primary/20',
    delivered: 'bg-secondary/10 text-secondary border-secondary/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    confirmed: 'bg-secondary/10 text-secondary border-secondary/20',
    completed: 'bg-muted text-muted-foreground border-border'
  };

  return (
    <div className="min-h-screen bg-background">
      <PatientNavbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">History</h1>
          <p className="text-muted-foreground">
            View your orders, prescriptions, and past appointments
          </p>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
              <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Prescriptions</span>
              <Badge variant="secondary" className="ml-1">{prescriptions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Appointments</span>
              <Badge variant="secondary" className="ml-1">{appointments.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Order #{order.id.slice(-6)}</CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-4 h-4" /> {order.orderDate}
                          </p>
                        </div>
                        <Badge className={statusColors[order.status]}>
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Pill className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{item.medicineName}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{order.deliveryAddress}</span>
                        </div>
                        <p className="text-lg font-bold text-primary">${order.total.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No orders yet</h3>
                <p className="text-muted-foreground">Your order history will appear here</p>
              </div>
            )}
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions">
            {prescriptions.length > 0 ? (
              <div className="space-y-4">
                {prescriptions.map((rx) => (
                  <Card key={rx.id} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{rx.diagnosis}</CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="w-4 h-4" /> {rx.doctorName}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{rx.date}</p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {rx.medicines.map((med, index) => (
                          <div key={index} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                              <Pill className="w-5 h-5 text-primary" />
                              <span className="font-medium text-foreground">{med.name}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                              <span>Dosage: {med.dosage}</span>
                              <span>Duration: {med.duration}</span>
                              <span>{med.instructions}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {rx.notes && (
                        <p className="mt-4 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          <strong>Notes:</strong> {rx.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No prescriptions yet</h3>
                <p className="text-muted-foreground">Prescriptions from your consultations will appear here</p>
              </div>
            )}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <Card key={apt.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{apt.doctorName}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> {apt.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" /> {apt.time}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className={statusColors[apt.status]}>
                          {apt.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No appointments yet</h3>
                <p className="text-muted-foreground">Your appointment history will appear here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <MedicineChatbot />
    </div>
  );
};

export default History;
