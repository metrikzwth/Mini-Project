import { useState } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getData, setData, STORAGE_KEYS, Order } from '@/lib/data';
import { Package, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>(getData(STORAGE_KEYS.ORDERS, []));

  const updateStatus = (id: string, status: Order['status']) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    setData(STORAGE_KEYS.ORDERS, updated);
    toast.success('Order status updated!');
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className={cn("transition-all pt-16 lg:pt-0 lg:pl-64", "p-8")}>
        <h1 className="text-3xl font-bold text-foreground mb-8">Orders</h1>
        <div className="space-y-4">
          {orders.map(o => (
            <Card key={o.id} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">Order #{o.id.slice(-6)}</h3>
                    <p className="text-sm text-muted-foreground">{o.patientName} • {o.orderDate}</p>
                  </div>
                  <Select value={o.status} onValueChange={v => updateStatus(o.id, v as Order['status'])}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground mb-2">{o.items.map(i => `${i.medicineName} x${i.quantity}`).join(', ')}</div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-4 h-4" /> {o.deliveryAddress}</span>
                  <span className="font-bold text-primary">${o.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {orders.length === 0 && <p className="text-center py-16 text-muted-foreground">No orders yet</p>}
        </div>
      </main>
    </div>
  );
};

export default AdminOrders;
