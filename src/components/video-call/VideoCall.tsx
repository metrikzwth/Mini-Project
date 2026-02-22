import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Mic, MicOff, VideoOff, Phone, Loader2, User, Paperclip, X, LogOut } from 'lucide-react';
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

    // Shared Document State
    const [sharedFile, setSharedFile] = useState<{ url: string, type: string, name: string } | null>(null);

    const myVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);
    const callRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const dataConnRef = useRef<any>(null);
    const retryRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);
    const connectedRef = useRef(false);
    const endedRef = useRef(false); // prevent double-end

    // Deterministic IDs
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9-_]/g, '_');
    const myId = sanitize(role === 'doctor' ? `doc - ${appointmentId} ` : `pat - ${appointmentId} `);
    const targetId = sanitize(role === 'doctor' ? `pat - ${appointmentId} ` : `doc - ${appointmentId} `);

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
                    console.log(`[VideoCall] Peer open: ${id} `);
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

                    // Setup Data Connection for File Sharing
                    const conn = peer.connect(targetId);
                    dataConnRef.current = conn;
                    conn.on('data', (data: any) => {
                        if (data.type === 'share-file') {
                            console.log('[VideoCall] Received shared file:', data.file.name);
                            toast.success(`Participant shared a document.`);
                            setSharedFile(data.file);
                        }
                    });
                    conn.on('error', (err) => console.error('[VideoCall] DataConnection error:', err));
                });

                // Answer incoming data connections
                peer.on('connection', (conn) => {
                    console.log('[VideoCall] Incoming data connection...');
                    dataConnRef.current = conn;
                    conn.on('data', (data: any) => {
                        if (data.type === 'share-file') {
                            console.log('[VideoCall] Received shared file:', data.file.name);
                            toast.success(`Participant shared a document.`);
                            setSharedFile(data.file);
                        }
                    });
                    conn.on('error', (err) => console.error('[VideoCall] DataConnection error:', err));
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
                        setStatus('Reconnecting (waiting for previous session to close)...');
                        if (peerRef.current) {
                            try { peerRef.current.destroy(); } catch { }
                        }
                        setTimeout(() => {
                            if (mountedRef.current && !connectedRef.current) init();
                        }, 3000);
                    } else {
                        setStatus(`Error: ${err.type} `);
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

    // File Upload Handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File is too large. Max 5MB allowed.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result as string;
            const sharedData = {
                url: base64Data,
                type: file.type.includes('pdf') ? 'pdf' : 'image',
                name: file.name
            };

            // Set locally
            setSharedFile(sharedData);

            // Broadcast to remote peer via DataConnection
            if (dataConnRef.current && dataConnRef.current.open) {
                try {
                    dataConnRef.current.send({ type: 'share-file', file: sharedData });
                    toast.success(`Shared ${file.name} `);
                } catch (err) {
                    console.error('[VideoCall] Failed to send file via PeerJS:', err);
                    toast.error("Failed to share file");
                }
            } else {
                toast.error("Not connected to peer yet");
            }
        };
        reader.readAsDataURL(file);
    };

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

        if (role === 'doctor') {
            // Doctors end the session for everyone
            try {
                const channel = new BroadcastChannel(`videocall - ${appointmentId} `);
                channel.postMessage({ type: 'call-ended', endedBy: role });
                channel.close();
            } catch { }
        } else {
            // Patient just dropping off silently (they can theoretically rejoin if Doctor is still there)
            console.log('[VideoCall] Patient disconnected locally.');
        }

        // Clean up WebRTC locally
        if (retryRef.current) clearInterval(retryRef.current);
        if (callRef.current) try { callRef.current.close(); } catch { }
        if (peerRef.current) try { peerRef.current.destroy(); } catch { }
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        setIsCallActive(false);
        setRemoteStream(null);
        setSharedFile(null);
        onEndCall();
    };

    useEffect(() => {
        const channel = new BroadcastChannel(`videocall - ${appointmentId} `);
        channel.onmessage = (event) => {
            if (event.data.type === 'call-ended' && role === 'patient') {
                toast.info('The consultation was concluded by the doctor.');
                endCall();
            }
        };
        return () => channel.close();
    }, [appointmentId, role]);

    return (
        <Card className="border-2 overflow-hidden h-full flex flex-col relative">
            <div className={cn("flex-1 min-h-0 bg-black flex", sharedFile ? "flex-row" : "flex-col")}>
                {/* Main Video Section */}
                <div className={cn("relative flex-1 min-w-0 flex items-center justify-center transition-all bg-black", sharedFile ? "w-1/2 border-r border-white/10" : "w-full")}>
                    {/* Remote Video (Main View) */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={cn("w-full h-full object-cover", !remoteStream && "hidden")}
                    />

                    {!remoteStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 space-y-4">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                                <User className="w-10 h-10" />
                            </div>
                            <p className="text-sm font-medium">Waiting for participant...</p>
                        </div>
                    )}

                    {/* Local Video (Picture-in-Picture) */}
                    <div className={cn(
                        "absolute bg-gray-900 rounded-lg border-2 border-white/20 overflow-hidden shadow-lg z-10",
                        sharedFile ? "bottom-2 right-2 w-24 h-16" : "bottom-4 right-4 w-40 h-28"
                    )}>
                        <video
                            ref={myVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className={cn("w-full h-full object-cover", isVideoOff && "hidden")}
                        />
                        {isVideoOff && (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                                <VideoOff className="w-6 h-6 text-white/50" />
                            </div>
                        )}
                        <div className="absolute bottom-1 left-2 text-[10px] text-white/80 bg-black/50 px-1 rounded">
                            You
                        </div>
                    </div>
                </div>

                {/* Shared Document Side Panel */}
                {sharedFile && (
                    <div className="w-1/2 h-full bg-zinc-900 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-center bg-zinc-800 p-2 sm:p-3 text-white border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-2 truncate pr-2">
                                <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded uppercase font-semibold tracking-wide shrink-0">{sharedFile.type}</span>
                                <span className="font-medium text-sm truncate">{sharedFile.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="hover:bg-white/10 h-7 w-7 text-white shrink-0" onClick={() => setSharedFile(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 w-full bg-black/50 p-2 overflow-hidden flex items-center justify-center relative">
                            {sharedFile.type === 'pdf' ? (
                                <iframe src={`${sharedFile.url} #toolbar = 0 & navpanes=0`} className="w-full h-full bg-white rounded shadow-inner" title="PDF Document" />
                            ) : (
                                <img src={sharedFile.url} alt="Shared Document" className="max-w-full max-h-full object-contain rounded" />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-4 bg-background border-t shrink-0 relative flex-none z-50">
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
                        title={role === 'doctor' ? "End Call completely" : "Leave Call"}
                    >
                        {role === 'doctor' ? <Phone className="h-5 w-5 rotate-[135deg]" /> : <LogOut className="h-5 w-5 ml-1" />}
                    </Button>

                    <Button
                        variant={isVideoOff ? "destructive" : "outline"}
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={toggleVideo}
                    >
                        {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>

                    {/* File Upload Button (Patient Only) */}
                    {role === 'patient' && (
                        <div className="relative">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full h-12 w-12 hover:bg-muted"
                                title="Share Document (PDF/Image)"
                            >
                                <label htmlFor={`upload - ${myId} `} className="cursor-pointer flex items-center justify-center w-full h-full">
                                    <Paperclip className="h-5 w-5" />
                                </label>
                            </Button>
                            <input
                                type="file"
                                id={`upload - ${myId} `}
                                accept="application/pdf,image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default VideoCall;
