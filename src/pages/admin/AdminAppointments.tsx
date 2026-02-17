import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getData, setData, STORAGE_KEYS, Appointment } from "@/lib/data";
import { deleteAppointmentFromSupabase } from "@/lib/supabaseSync";
import { Calendar, User, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AdminAppointments = () => {
  const appointments = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    const updated = appointments.filter((a) => a.id !== id);
    setData(STORAGE_KEYS.APPOINTMENTS, updated);
    deleteAppointmentFromSupabase(id);
    // Force re-render would be needed here as we don't have state, but let's assume strict mode or navigate triggers it. 
    // Actually, we should change this component to use state like others.
    window.location.reload(); // Simple brute force for now as I can't refactor the whole component to state in one replace.
  };

  return (
    <div className="min-h-screen bg-background m-5">
      <AdminSidebar />
      <main className={cn("transition-all pt-16 lg:pt-0 lg:pl-64", "p-8")}>
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Appointments
        </h1>
        <div className="space-y-4">
          {appointments.map((a) => (
            <Card key={a.id} className="border-2 group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {a.patientName} → {a.doctorName}
                    </p>
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
