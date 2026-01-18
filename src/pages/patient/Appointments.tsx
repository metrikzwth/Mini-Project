import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PatientNavbar from '@/components/layout/PatientNavbar';
import MedicineChatbot from '@/components/chatbot/MedicineChatbot';
import { useAuth } from '@/contexts/AuthContext';
import { getData, setData, STORAGE_KEYS, Doctor, Appointment } from '@/lib/data';
import { 
  Calendar, 
  Clock, 
  Star, 
  Video, 
  User,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const Appointments = () => {
  const { user } = useAuth();
  const doctors = getData<Doctor[]>(STORAGE_KEYS.DOCTORS, []).filter(d => d.isActive);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>(
    getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []).filter(a => a.patientId === user?.id)
  );
  
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    type: 'video' as 'video' | 'in-person'
  });

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !bookingData.date || !bookingData.time) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsBooking(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newAppointment: Appointment = {
      id: `APT${Date.now()}`,
      patientId: user?.id || '',
      patientName: user?.name || '',
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      date: bookingData.date,
      time: bookingData.time,
      status: 'pending',
      type: bookingData.type
    };

    const appointments = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    appointments.push(newAppointment);
    setData(STORAGE_KEYS.APPOINTMENTS, appointments);
    
    setMyAppointments(prev => [...prev, newAppointment]);
    setSelectedDoctor(null);
    setBookingData({ date: '', time: '', type: 'video' });
    setIsBooking(false);
    toast.success('Appointment booked successfully!');
  };

  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div className="min-h-screen bg-background">
      <PatientNavbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Book Appointments</h1>
          <p className="text-muted-foreground">
            Schedule a consultation with our experienced doctors
          </p>
        </div>

        {/* My Appointments */}
        {myAppointments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-4">Your Appointments</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAppointments.map((apt) => (
                <Card key={apt.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Video className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{apt.doctorName}</h3>
                        <Badge variant={
                          apt.status === 'confirmed' ? 'default' :
                          apt.status === 'completed' ? 'secondary' :
                          apt.status === 'cancelled' ? 'destructive' : 'outline'
                        }>
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {apt.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {apt.time}
                      </span>
                    </div>
                    {apt.status === 'confirmed' && (
                      <Button className="w-full mt-4" variant="secondary">
                        <Video className="w-4 h-4 mr-2" />
                        Join Consultation
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Doctors */}
        <h2 className="text-xl font-bold text-foreground mb-4">Available Doctors</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="border-2 card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-8 h-8 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{doctor.name}</CardTitle>
                    <CardDescription>{doctor.specialization}</CardDescription>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="text-sm font-medium">{doctor.rating}</span>
                      <span className="text-sm text-muted-foreground">• {doctor.experience} yrs exp</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {doctor.availability.map((day) => (
                    <Badge key={day} variant="outline" className="text-xs">{day}</Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">Consultation Fee</span>
                  <span className="text-xl font-bold text-primary">${doctor.fee}</span>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Booking Dialog */}
        <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Book Appointment</DialogTitle>
              <DialogDescription>
                Schedule a consultation with {selectedDoctor?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold">{selectedDoctor?.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedDoctor?.specialization}</p>
                </div>
                <Badge className="ml-auto">${selectedDoctor?.fee}</Badge>
              </div>

              <div className="space-y-2">
                <Label>Select Date</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Time</Label>
                <Select value={bookingData.time} onValueChange={(value) => setBookingData({ ...bookingData, time: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a time slot" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Consultation Type</Label>
                <Select value={bookingData.type} onValueChange={(value: 'video' | 'in-person') => setBookingData({ ...bookingData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="video">Video Consultation</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDoctor(null)}>Cancel</Button>
              <Button onClick={handleBookAppointment} disabled={isBooking}>
                {isBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <MedicineChatbot />
    </div>
  );
};

export default Appointments;
