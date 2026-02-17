import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import PatientNavbar from '@/components/layout/PatientNavbar';
import MedicineChatbot from '@/components/chatbot/MedicineChatbot';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { getData, setData, STORAGE_KEYS, Order, Prescription, Appointment, hideItemForUser, getHiddenItems, clearHiddenItems } from '@/lib/data';
import { syncOrderStatusToSupabase, deleteOrderFromSupabase, deleteAppointmentFromSupabase } from '@/lib/supabaseSync';
import {
  Package,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Pill,
  User,
  XCircle,
  Loader2,
  Trash2,
  Eraser
} from 'lucide-react';
import { toast } from 'sonner';

const History = () => {
  const { user } = useAuth();
  const { addCredits } = useWallet();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  // Listen for real-time updates (from Doctor portal)
  useEffect(() => {
    // 1. Local storage event (same tab/window)
    const handleUpdate = () => forceUpdate(n => n + 1);
    window.addEventListener('localDataUpdate', handleUpdate);

    // 2. Broadcast channel (cross-tab)
    const channel = new BroadcastChannel('medicare_data_updates');
    channel.onmessage = (event) => {
      console.log('[History] Received broadcast update:', event.data);
      if (event.data.type === 'update') {
        handleUpdate();
      }
    };

    return () => {
      window.removeEventListener('localDataUpdate', handleUpdate);
      channel.close();
    };
  }, []);

  const hiddenOrderIds = getHiddenItems(STORAGE_KEYS.HIDDEN_ORDERS, user?.id || '');
  const orders = getData<Order[]>(STORAGE_KEYS.ORDERS, [])
    .filter(o => o.patientId === user?.id && !hiddenOrderIds.includes(o.id))
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  const hiddenRxIds = getHiddenItems(STORAGE_KEYS.HIDDEN_PRESCRIPTIONS, user?.id || '');
  const prescriptions = getData<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, [])
    .filter(p => p.patientId === user?.id && !hiddenRxIds.includes(p.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hiddenAptIds = getHiddenItems(STORAGE_KEYS.HIDDEN_APPOINTMENTS, user?.id || '');
  const appointments = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, [])
    .filter(a => a.patientId === user?.id && !hiddenAptIds.includes(a.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCancelOrder = async (order: Order) => {
    if (!confirm(`Are you sure you want to cancel Order #${order.id.slice(-6)}?`)) return;

    setCancellingId(order.id);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 800));

    // Update order status in storage
    const allOrders = getData<Order[]>(STORAGE_KEYS.ORDERS, []);
    const updatedOrders = allOrders.map(o => {
      if (o.id === order.id) {
        return { ...o, status: "Cancelled" as const };
      }
      return o;
    });
    setData(STORAGE_KEYS.ORDERS, updatedOrders);
    syncOrderStatusToSupabase(order.id, 'Cancelled');

    // Refund if paid via wallet
    if (order.paymentMethod === 'wallet') {
      await addCredits(order.total, `Refund: Order #${order.id.slice(-6)} cancelled`);
      toast.success(`Order cancelled — $${order.total.toFixed(2)} refunded to wallet`);
    } else {
      toast.success('Order cancelled successfully');
    }

    setCancellingId(null);
    forceUpdate(n => n + 1);
  };

  // HIDE individual order (soft-delete — only affects this user)
  const handleDeleteOrder = (orderId: string) => {
    if (!confirm('Remove this order from your history?')) return;
    hideItemForUser(STORAGE_KEYS.HIDDEN_ORDERS, user?.id || '', orderId);
    toast.success('Order removed from history');
    forceUpdate(n => n + 1);
  };

  // CLEAR all orders (soft-delete — only affects this user)
  const handleClearAllOrders = () => {
    if (!confirm(`Clear all ${orders.length} orders from your history? This cannot be undone.`)) return;
    const ids = orders.map(o => o.id);
    clearHiddenItems(STORAGE_KEYS.HIDDEN_ORDERS, user?.id || '', ids);
    toast.success('Order history cleared');
    forceUpdate(n => n + 1);
  };

  // HIDE individual appointment (soft-delete — only affects this user)
  const handleDeleteAppointment = (aptId: string) => {
    if (!confirm('Remove this appointment from your history?')) return;
    hideItemForUser(STORAGE_KEYS.HIDDEN_APPOINTMENTS, user?.id || '', aptId);
    toast.success('Appointment removed from history');
    forceUpdate(n => n + 1);
  };

  // CLEAR all appointments (soft-delete — only affects this user)
  const handleClearAllAppointments = () => {
    if (!confirm(`Clear all ${appointments.length} appointments from your history? This cannot be undone.`)) return;
    const ids = appointments.map(a => a.id);
    clearHiddenItems(STORAGE_KEYS.HIDDEN_APPOINTMENTS, user?.id || '', ids);
    toast.success('Appointment history cleared');
    forceUpdate(n => n + 1);
  };

  // HIDE individual prescription (soft-delete — only affects this user)
  const handleDeletePrescription = (rxId: string) => {
    if (!confirm('Remove this prescription from your history?')) return;
    hideItemForUser(STORAGE_KEYS.HIDDEN_PRESCRIPTIONS, user?.id || '', rxId);
    toast.success('Prescription removed from history');
    forceUpdate(n => n + 1);
  };

  // CLEAR all prescriptions (soft-delete — only affects this user)
  const handleClearAllPrescriptions = () => {
    if (!confirm(`Clear all ${prescriptions.length} prescriptions from your history? This cannot be undone.`)) return;
    const ids = prescriptions.map(r => r.id);
    clearHiddenItems(STORAGE_KEYS.HIDDEN_PRESCRIPTIONS, user?.id || '', ids);
    toast.success('Prescription history cleared');
    forceUpdate(n => n + 1);
  };

  const statusColors: Record<string, string> = {
    Pending: 'bg-warning/10 text-warning border-warning/20',
    Processing: 'bg-info/10 text-info border-info/20',
    Shipped: 'bg-primary/10 text-primary border-primary/20',
    Delivered: 'bg-secondary/10 text-secondary border-secondary/20',
    Cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
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
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleClearAllOrders}>
                    <Eraser className="w-4 h-4 mr-1" /> Clear All Orders
                  </Button>
                </div>
                {orders.map((order) => (
                  <Card key={order.id} className={`border-2 ${order.status === 'Cancelled' ? 'opacity-70' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Order #{order.id.slice(-6)}</CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-4 h-4" /> {order.orderDate}
                            {order.paymentMethod && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {order.paymentMethod === 'wallet' ? '💳 Wallet' : '💵 COD'}
                              </Badge>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[order.status] || ''}>
                            {order.status}
                          </Badge>
                          {/* Cancel Button — only for Pending/Processing orders */}
                          {(order.status === 'Pending' || order.status === 'Processing') && (
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={cancellingId === order.id}
                              onClick={() => handleCancelOrder(order)}
                              className="h-7 px-2 text-xs"
                            >
                              {cancellingId === order.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          )}
                          {/* Delete Button — remove from history */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
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
                        <p className={`text-lg font-bold ${order.status === 'Cancelled' ? 'text-destructive line-through' : 'text-primary'}`}>
                          ${order.total.toFixed(2)}
                        </p>
                      </div>
                      {order.status === 'Cancelled' && order.paymentMethod === 'wallet' && (
                        <p className="text-xs text-green-600 text-right mt-1">
                          ✓ Refunded to wallet
                        </p>
                      )}
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
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleClearAllPrescriptions}>
                    <Eraser className="w-4 h-4 mr-1" /> Clear All Prescriptions
                  </Button>
                </div>
                {prescriptions.map((rx) => (
                  <Card key={rx.id} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{rx.diagnosis}</CardTitle>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" /> Dr. {rx.doctorName.replace(/^Dr\.?\s*/i, '')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" /> {rx.date}
                            </span>
                            {rx.consultationTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" /> {rx.consultationTime}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Rx #{rx.id.replace('RX', '').slice(-6)}</Badge>
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
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleClearAllAppointments}>
                    <Eraser className="w-4 h-4 mr-1" /> Clear All Appointments
                  </Button>
                </div>
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
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[apt.status] || ''}>
                            {apt.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAppointment(apt.id)}
                            className="h-7 px-2 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
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
