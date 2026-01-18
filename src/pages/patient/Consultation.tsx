import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PatientNavbar from '@/components/layout/PatientNavbar';
import MedicineChatbot from '@/components/chatbot/MedicineChatbot';
import { useAuth } from '@/contexts/AuthContext';
import { getData, STORAGE_KEYS, Appointment } from '@/lib/data';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Phone, 
  MessageSquare,
  User,
  Clock,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Consultation = () => {
  const { user } = useAuth();
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const confirmedAppointments = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, [])
    .filter(a => a.patientId === user?.id && a.status === 'confirmed');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = () => {
    setIsInCall(true);
    setCallDuration(0);
  };

  const endCall = () => {
    setIsInCall(false);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <PatientNavbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Video Consultation</h1>
          <p className="text-muted-foreground">
            Connect with your doctor through secure video calls
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Call Area */}
          <div className="lg:col-span-2">
            <Card className="border-2 overflow-hidden">
              <div className="relative aspect-video bg-foreground/5">
                {isInCall ? (
                  <>
                    {/* Doctor's Video (Main) */}
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <div className="w-32 h-32 bg-secondary/20 rounded-full flex items-center justify-center">
                        <User className="w-16 h-16 text-secondary" />
                      </div>
                      <Badge className="absolute top-4 left-4 bg-secondary">
                        Dr. Sarah Johnson
                      </Badge>
                    </div>

                    {/* Patient's Video (Picture in Picture) */}
                    <div className={cn(
                      "absolute bottom-4 right-4 w-32 h-24 rounded-lg border-2 border-card overflow-hidden",
                      isVideoOff ? "bg-foreground/10" : "bg-muted"
                    )}>
                      {isVideoOff ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <VideoOff className="w-6 h-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <User className="w-8 h-8 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Call Duration */}
                    <Badge className="absolute top-4 right-4 bg-destructive">
                      <span className="animate-pulse mr-2">●</span>
                      {formatDuration(callDuration)}
                    </Badge>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Video className="w-20 h-20 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Connect</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Start a video consultation with your doctor. Make sure your camera and microphone are working properly.
                    </p>
                  </div>
                )}
              </div>

              {/* Call Controls */}
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4">
                  {isInCall ? (
                    <>
                      <Button
                        variant="outline"
                        size="lg"
                        className={cn(
                          "rounded-full w-14 h-14",
                          isMuted && "bg-destructive/10 border-destructive text-destructive"
                        )}
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </Button>
                      
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 bg-destructive hover:bg-destructive/90"
                        onClick={endCall}
                      >
                        <Phone className="w-6 h-6 rotate-[135deg]" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="lg"
                        className={cn(
                          "rounded-full w-14 h-14",
                          isVideoOff && "bg-destructive/10 border-destructive text-destructive"
                        )}
                        onClick={() => setIsVideoOff(!isVideoOff)}
                      >
                        {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="lg" 
                      className="px-8"
                      onClick={startCall}
                      disabled={confirmedAppointments.length === 0}
                    >
                      <Video className="w-5 h-5 mr-2" />
                      Start Video Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Consultations */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Scheduled Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {confirmedAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {confirmedAppointments.map((apt) => (
                      <div key={apt.id} className="p-3 bg-muted rounded-lg">
                        <p className="font-medium text-foreground">{apt.doctorName}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {apt.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {apt.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No confirmed appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-secondary" />
                  Consultation Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Find a quiet, well-lit space for your call
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Have your medical records ready to share
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Write down your symptoms and questions beforehand
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <MedicineChatbot />
    </div>
  );
};

export default Consultation;
