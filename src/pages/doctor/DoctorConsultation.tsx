import DoctorNavbar from '@/components/layout/DoctorNavbar';
import { Card, CardContent } from '@/components/ui/card';
import VideoCall from '@/components/video-call/VideoCall';
import { Button } from '@/components/ui/button';
import { Video, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const DoctorConsultation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointmentId } = location.state || {};
  const [isInCall, setIsInCall] = useState(!!appointmentId);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DoctorNavbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Video Consultation</h1>


        {!appointmentId ? (
          <div className="text-center py-20 border-2 rounded-lg border-dashed">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Appointment Selected</h3>
            <p className="text-muted-foreground mb-6">Please select a confirmed appointment to start a consultation.</p>
            <Button onClick={() => navigate('/doctor/appointments')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Go to Appointments
            </Button>
          </div>
        ) : (
          <div className="h-[600px]">
            {isInCall ? (
              <VideoCall
                appointmentId={appointmentId}
                role="doctor"
                onEndCall={() => setIsInCall(false)}
              />
            ) : (
              <Card className="border-2 h-full flex flex-col items-center justify-center p-8 bg-muted/30">
                <div className="bg-primary/10 p-6 rounded-full mb-6">
                  <Video className="w-16 h-16 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ready to Start</h2>
                <p className="text-muted-foreground mb-8 text-center max-w-md">
                  You are about to start a video consultation for Appointment ID: <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{appointmentId.slice(0, 8)}...</span>
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" size="lg" onClick={() => navigate('/doctor/appointments')}>
                    Cancel
                  </Button>
                  <Button size="lg" onClick={() => setIsInCall(true)}>
                    Start Consultation
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorConsultation;
