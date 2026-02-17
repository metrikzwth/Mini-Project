import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DoctorNavbar from '@/components/layout/DoctorNavbar';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { getData, setData, STORAGE_KEYS, Appointment, User } from '@/lib/data';
import { syncAppointmentToSupabase, deleteAppointmentFromSupabase } from '@/lib/supabaseSync';
import { Calendar, Clock, User as UserIcon, CheckCircle, XCircle, Trash2, Eraser } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const { addCredits, transferCredits } = useWallet();
  const [appointments, setAppointments] = useState<Appointment[]>(
    getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []).filter(a => a.doctorName === user?.name)
  );
  const users = getData<User[]>(STORAGE_KEYS.USERS, []);

  const updateStatus = async (id: string, status: Appointment['status']) => {
    const allApts = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const appointmentToUpdate = allApts.find(a => a.id === id);

    if (status === 'cancelled' && appointmentToUpdate?.paymentMethod === 'wallet' && appointmentToUpdate.fee) {
      // Refund the patient
      toast.info("Processing refund...");

      let success = false;
      // If the current user (Doctor) is the one cancelling, we should TRANSFER back to patient.
      // This maintains the closed loop economy.
      if (user?.id) {
        // Attempt transfer first
        success = await transferCredits(
          appointmentToUpdate.fee,
          appointmentToUpdate.patientId,
          `Refund for cancelled appointment with ${user?.name}`
        );
      } else {
        // Fallback: System Refund (Minting)
        success = await addCredits(
          appointmentToUpdate.fee,
          `Refund for cancelled appointment with ${user?.name}`,
          appointmentToUpdate.patientId,
          'refund'
        );
      }

      if (success) {
        toast.success("Refund processed successfully");
      } else {
        toast.error("Failed to process refund. Ensure you have sufficient balance.");
        return; // Stop cancellation if refund fails
      }
    }

    const updated = allApts.map(a => a.id === id ? { ...a, status } : a);
    setData(STORAGE_KEYS.APPOINTMENTS, updated);
    const updatedAppt = updated.find(a => a.id === id);
    if (updatedAppt) syncAppointmentToSupabase(updatedAppt);
    setAppointments(updated.filter(a => a.doctorName === user?.name));
    toast.success(`Appointment ${status}`);
  };

  // DELETE individual appointment
  const handleDeleteAppointment = (aptId: string) => {
    if (!confirm('Remove this appointment from your list?')) return;
    const allApts = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const updated = allApts.filter(a => a.id !== aptId);
    setData(STORAGE_KEYS.APPOINTMENTS, updated);
    deleteAppointmentFromSupabase(aptId);
    setAppointments(updated.filter(a => a.doctorName === user?.name));
    toast.success('Appointment removed');
  };

  // CLEAR all appointments
  const handleClearAllAppointments = () => {
    if (!confirm(`Clear all ${appointments.length} appointments? This cannot be undone.`)) return;
    const allApts = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const otherApts = allApts.filter(a => a.doctorName !== user?.name);
    setData(STORAGE_KEYS.APPOINTMENTS, otherApts);
    appointments.forEach(a => deleteAppointmentFromSupabase(a.id));
    setAppointments([]);
    toast.success('All appointments cleared');
  };

  return (
    <div className="min-h-screen bg-background">
      <DoctorNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          {appointments.length > 0 && (
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleClearAllAppointments}>
              <Eraser className="w-4 h-4 mr-1" /> Clear All
            </Button>
          )}
        </div>
        <div className="space-y-4">
          {appointments.map((apt) => {
            const patient = users.find(u => u.id === apt.patientId);
            return (
              <Card key={apt.id} className="border-2">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border">
                      {patient?.image ? (
                        <img src={patient.image} alt="Patient" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-6 h-6 text-primary" />
                      )}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAppointment(apt.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {appointments.length === 0 && (
            <p className="text-center py-16 text-muted-foreground">No appointments scheduled</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorAppointments;
