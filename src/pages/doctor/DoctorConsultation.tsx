import DoctorNavbar from '@/components/layout/DoctorNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Mic, MicOff, VideoOff, Phone, User } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const DoctorConsultation = () => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DoctorNavbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Video Consultation</h1>
        <Card className="border-2 overflow-hidden">
          <div className="relative aspect-video bg-muted flex items-center justify-center">
            {isInCall ? (
              <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-16 h-16 text-primary" />
              </div>
            ) : (
              <div className="text-center">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Ready to start consultation</p>
              </div>
            )}
          </div>
          <CardContent className="p-6 flex justify-center gap-4">
            {isInCall ? (
              <>
                <Button variant="outline" size="lg" className={cn("rounded-full", isMuted && "bg-destructive/10")} onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                <Button size="lg" className="rounded-full bg-destructive" onClick={() => setIsInCall(false)}>
                  <Phone className="w-5 h-5 rotate-[135deg]" />
                </Button>
                <Button variant="outline" size="lg" className={cn("rounded-full", isVideoOff && "bg-destructive/10")} onClick={() => setIsVideoOff(!isVideoOff)}>
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </Button>
              </>
            ) : (
              <Button size="lg" onClick={() => setIsInCall(true)}>
                <Video className="w-5 h-5 mr-2" /> Start Call
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DoctorConsultation;
