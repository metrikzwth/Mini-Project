import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Mic, MicOff, VideoOff, Phone, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getData, setData, STORAGE_KEYS, Appointment } from '@/lib/data';

interface VideoCallProps {
    appointmentId: string;
    role: 'doctor' | 'patient';
    onEndCall: () => void;
}

const VideoCall = ({ appointmentId, role, onEndCall }: VideoCallProps) => {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [status, setStatus] = useState<string>('Initializing...');
    const [isCallActive, setIsCallActive] = useState(false);
    const [myPeerId, setMyPeerId] = useState('');

    const myVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);
    const callRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const retryRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);
    const connectedRef = useRef(false);
    const endedRef = useRef(false); // prevent double-end

    // Deterministic IDs
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9-_]/g, '_');
    const myId = sanitize(role === 'doctor' ? `doc-${appointmentId}` : `pat-${appointmentId}`);
    const targetId = sanitize(role === 'doctor' ? `pat-${appointmentId}` : `doc-${appointmentId}`);

    // Handle incoming remote stream — shared by both caller and answerer
    const onRemoteStream = useCallback((remoteMediaStream: MediaStream) => {
        if (!mountedRef.current || connectedRef.current) return;
        console.log('[VideoCall] ✅ Got remote stream!');
        connectedRef.current = true;
        setRemoteStream(remoteMediaStream);
        setIsCallActive(true);
        setStatus('Connected');

        // Stop retrying
        if (retryRef.current) {
            clearInterval(retryRef.current);
            retryRef.current = null;
        }

        // Attach to video element (also handled by ref callback, but belt-and-suspenders)
        setTimeout(() => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteMediaStream;
            }
        }, 100);
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        connectedRef.current = false;

        const init = async () => {
            try {
                // 1. Get camera/mic
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                if (!mountedRef.current) {
                    mediaStream.getTracks().forEach(t => t.stop());
                    return;
                }

                streamRef.current = mediaStream;
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = mediaStream;
                }

                // 2. Create Peer
                const peer = new Peer(myId, {
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                            { urls: 'stun:stun2.l.google.com:19302' },
                            { urls: 'stun:global.stun.twilio.com:3478' }
                        ]
                    }
                });
                peerRef.current = peer;

                peer.on('open', (id) => {
                    if (!mountedRef.current) return;
                    console.log(`[VideoCall] Peer open: ${id}`);
                    setMyPeerId(id);
                    setStatus('Connecting to other party...');

                    // Auto-call the target
                    const tryCall = () => {
                        if (!mountedRef.current || connectedRef.current || !peerRef.current?.open) return;
                        console.log(`[VideoCall] Calling ${targetId}...`);
                        try {
                            const call = peer.call(targetId, mediaStream);
                            if (call) {
                                call.on('stream', onRemoteStream);
                                call.on('close', () => console.log('[VideoCall] Outbound call closed'));
                                call.on('error', (e: any) => console.error('[VideoCall] Outbound call error:', e));
                                callRef.current = call;
                            }
                        } catch (e) {
                            console.error('[VideoCall] Call attempt error:', e);
                        }
                    };

                    // First attempt immediately
                    tryCall();

                    // Retry every 3 seconds
                    retryRef.current = setInterval(() => {
                        if (connectedRef.current) {
                            if (retryRef.current) clearInterval(retryRef.current);
                            return;
                        }
                        tryCall();
                    }, 3000);
                });

                // Answer incoming calls
                peer.on('call', (incomingCall) => {
                    if (!mountedRef.current) return;
                    console.log('[VideoCall] Answering incoming call...');
                    incomingCall.answer(mediaStream);
                    incomingCall.on('stream', onRemoteStream);
                    incomingCall.on('close', () => console.log('[VideoCall] Incoming call closed'));
                    callRef.current = incomingCall;
                });

                peer.on('error', (err) => {
                    console.error('[VideoCall] Peer error:', err.type, err);
                    if (!mountedRef.current) return;
                    if (err.type === 'peer-unavailable') {
                        setStatus('Waiting for other party to join...');
                    } else if (err.type === 'unavailable-id') {
                        setStatus('ID conflict — close other tabs');
                        toast.error('Close other tabs using this appointment');
                    } else {
                        setStatus(`Error: ${err.type}`);
                    }
                });

                peer.on('disconnected', () => {
                    if (mountedRef.current && peerRef.current && !peerRef.current.destroyed) {
                        console.log('[VideoCall] Reconnecting peer...');
                        peerRef.current.reconnect();
                    }
                });

            } catch (err) {
                console.error('[VideoCall] Init error:', err);
                if (mountedRef.current) {
                    setStatus('Camera/Mic access denied');
                    toast.error('Please grant camera and microphone permissions');
                }
            }
        };

        init();

        return () => {
            mountedRef.current = false;
            if (retryRef.current) {
                clearInterval(retryRef.current);
                retryRef.current = null;
            }
            if (callRef.current) {
                try { callRef.current.close(); } catch { }
            }
            if (peerRef.current) {
                try { peerRef.current.destroy(); } catch { }
                peerRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
    }, [appointmentId, role, myId, targetId, onRemoteStream]);

    // Listen for call-end broadcast from the other party
    useEffect(() => {
        const channel = new BroadcastChannel(`videocall-${appointmentId}`);
        channel.onmessage = (event) => {
            if (event.data?.type === 'call-ended' && event.data?.endedBy !== role) {
                console.log('[VideoCall] Other party ended the call');
                toast.info('The other party has ended the consultation.');
                // Clean up without re-broadcasting
                if (retryRef.current) clearInterval(retryRef.current);
                if (callRef.current) try { callRef.current.close(); } catch { }
                if (peerRef.current) try { peerRef.current.destroy(); } catch { }
                if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
                setIsCallActive(false);
                setRemoteStream(null);
                onEndCall();
            }
        };
        return () => channel.close();
    }, [appointmentId, role, onEndCall]);

    const toggleMute = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
            setIsMuted(prev => !prev);
        }
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
            setIsVideoOff(prev => !prev);
        }
    };

    const endCall = () => {
        if (endedRef.current) return;
        endedRef.current = true;

        // Broadcast to other tab that call has ended
        try {
            const channel = new BroadcastChannel(`videocall-${appointmentId}`);
            channel.postMessage({ type: 'call-ended', endedBy: role });
            channel.close();
        } catch { }

        // Mark appointment as completed so it can't be called again
        try {
            const appointments = getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
            const updated = appointments.map(a =>
                a.id === appointmentId ? { ...a, status: 'completed' as const } : a
            );
            setData(STORAGE_KEYS.APPOINTMENTS, updated);
        } catch { }

        // Clean up WebRTC
        if (retryRef.current) clearInterval(retryRef.current);
        if (callRef.current) try { callRef.current.close(); } catch { }
        if (peerRef.current) try { peerRef.current.destroy(); } catch { }
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        setIsCallActive(false);
        setRemoteStream(null);
        onEndCall();
    };

    return (
        <Card className="border-2 overflow-hidden h-full flex flex-col">
            <div className="relative flex-1 bg-black min-h-[400px]">
                {/* Remote Video (Main View) */}
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 space-y-4">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                            <User className="w-10 h-10" />
                        </div>
                        <p className="text-lg font-medium">{status}</p>
                        {!isCallActive && (
                            <div className="flex items-center gap-2 text-white/50">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Auto-connecting...</span>
                            </div>
                        )}
                        {/* Debug info */}
                        <div className="mt-4 p-3 bg-black/60 rounded-lg text-xs font-mono text-left space-y-1">
                            <p>📋 Appointment: <span className="text-blue-400">{appointmentId}</span></p>
                            <p>🆔 My ID: <span className="text-green-400">{myPeerId || myId}</span></p>
                            <p>🎯 Target: <span className="text-yellow-400">{targetId}</span></p>
                            <p>📡 Status: <span className="text-purple-400">{status}</span></p>
                        </div>
                    </div>
                )}

                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute bottom-4 right-4 w-40 h-28 bg-gray-900 rounded-lg border-2 border-white/20 overflow-hidden shadow-lg z-10">
                    <video
                        ref={myVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className={cn("w-full h-full object-cover", isVideoOff && "hidden")}
                    />
                    {isVideoOff && (
                        <div className="w-full h-full flex items-center justify-center">
                            <VideoOff className="w-8 h-8 text-white/50" />
                        </div>
                    )}
                    <div className="absolute bottom-1 left-2 text-[10px] text-white/80 bg-black/50 px-1 rounded">
                        You ({role})
                    </div>
                </div>
            </div>

            {/* Controls */}
            <CardContent className="p-4 bg-background border-t">
                <div className="flex justify-center gap-4">
                    <Button
                        variant={isMuted ? "destructive" : "outline"}
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={toggleMute}
                    >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>

                    <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={endCall}
                    >
                        <Phone className="h-5 w-5 rotate-[135deg]" />
                    </Button>

                    <Button
                        variant={isVideoOff ? "destructive" : "outline"}
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={toggleVideo}
                    >
                        {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default VideoCall;
