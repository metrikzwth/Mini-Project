import { useState, useEffect } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getData, setData, STORAGE_KEYS, Appointment } from "@/lib/data";
import { deleteAppointmentFromSupabase } from "@/lib/supabaseSync";
import { Calendar, User, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(
    () => getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, [])
  );
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const handleUpdate = () => {
      setAppointments(getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []));
    };

    window.addEventListener('localDataUpdate', handleUpdate);
    const channel = new BroadcastChannel('medicare_data_updates');
    channel.onmessage = (event) => {
      if (event.data.type === 'update') {
        handleUpdate();
      }
    };

    return () => {
      window.removeEventListener('localDataUpdate', handleUpdate);
      channel.close();
    };
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    const updated = appointments.filter((a) => a.id !== id);
    setData(STORAGE_KEYS.APPOINTMENTS, updated);
    deleteAppointmentFromSupabase(id);
    setAppointments(updated);
    toast.success("Appointment deleted successfully");
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const timeA = parseInt(a.id.replace(/\D/g, '')) || 0;
    const timeB = parseInt(b.id.replace(/\D/g, '')) || 0;
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="min-h-screen bg-background m-5">
      <AdminSidebar />
      <main className={cn("transition-all pt-16 lg:pt-0 lg:pl-64", "p-8")}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Appointments
          </h1>
          <Button
            variant="outline"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2"
          >
            Sort by Initiated Time: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>
        <div className="space-y-4">
          {sortedAppointments.map((a) => (
            <Card key={a.id} className="border-2 group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {a.patientName} → {a.doctorName}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {a.type === 'video' ? '📹 Video' : '🏥 In-Person'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {a.date}{" "}
                      <Clock className="w-4 h-4" /> {a.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{a.status}</Badge>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDelete(a.id, e)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {appointments.length === 0 && (
            <p className="text-center py-16 text-muted-foreground">
              No appointments yet
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAppointments;
