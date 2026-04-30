import { useEffect, useRef, useState, useCallback } from 'react';
import { recognizeGesture, translations, type GestureResult } from '@/lib/gestureRecognition';
import { speak, playAlertSound } from '@/lib/speechUtils';
import { Camera, CameraOff, Volume2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  language: string;
  onGestureDetected?: (gesture: string) => void;
}

export default function CameraGestureDetector({ language, onGestureDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<GestureResult | null>(null);
  const [isHelp, setIsHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handLandmarkerRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const lastSpokenRef = useRef<string>('');
  const lastSpeakTimeRef = useRef<number>(0);

  const loadMediaPipe = useCallback(async () => {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { HandLandmarker, FilesetResolver } = vision;
      
      const wasmFileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      const handLandmarker = await HandLandmarker.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });
      
      handLandmarkerRef.current = handLandmarker;
    } catch (err) {
      console.error('MediaPipe load error:', err);
      setError('Failed to load hand detection model. Please try again.');
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCurrentGesture(null);
    setIsHelp(false);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const detectGestures = useCallback(() => {
    if (!videoRef.current || !handLandmarkerRef.current || !cameraActive) return;

    const video = videoRef.current;
    if (video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectGestures);
      return;
    }

    try {
      const results = handLandmarkerRef.current.detectForVideo(video, performance.now());
      
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const gesture = recognizeGesture(landmarks);
        
        if (gesture) {
          setCurrentGesture(gesture);
          const isHelpGesture = gesture.gesture === 'Help';
          setIsHelp(isHelpGesture);
          onGestureDetected?.(gesture.gesture);

          // Speak with debounce
          const now = Date.now();
          if (gesture.gesture !== lastSpokenRef.current || now - lastSpeakTimeRef.current > 3000) {
            if (isHelpGesture) {
              playAlertSound();
            } else {
              const translatedText = translations[language]?.[gesture.gesture] || gesture.gesture;
              speak(translatedText, language);
            }
            lastSpokenRef.current = gesture.gesture;
            lastSpeakTimeRef.current = now;
          }
        }

        // Draw landmarks on canvas
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = video.videoWidth;
            canvasRef.current.height = video.videoHeight;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            
            // Draw connections
            ctx.strokeStyle = isHelp ? '#ef4444' : '#2dd4bf';
            ctx.lineWidth = 2;
            for (const lm of landmarks) {
              ctx.beginPath();
              ctx.arc(lm.x * canvasRef.current.width, lm.y * canvasRef.current.height, 4, 0, 2 * Math.PI);
              ctx.fillStyle = isHelp ? '#ef4444' : '#2dd4bf';
              ctx.fill();
            }
          }
        }
      } else {
        setCurrentGesture(null);
        setIsHelp(false);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    } catch (err) {
      // Silently continue
    }

    animFrameRef.current = requestAnimationFrame(detectGestures);
  }, [cameraActive, language, onGestureDetected]);

  useEffect(() => {
    loadMediaPipe();
    return () => {
      stopCamera();
      handLandmarkerRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (cameraActive && handLandmarkerRef.current) {
      animFrameRef.current = requestAnimationFrame(detectGestures);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [cameraActive, detectGestures]);

  const translatedText = currentGesture
    ? translations[language]?.[currentGesture.gesture] || currentGesture.gesture
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Camera viewport */}
      <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
        isHelp ? 'border-destructive glow-alert animate-pulse-alert' : 'border-border'
      }`}>
        <video
          ref={videoRef}
          className="w-full aspect-video object-cover bg-muted"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 gap-3">
            <CameraOff className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Camera is off</p>
          </div>
        )}

        {/* Help overlay */}
        {isHelp && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 backdrop-blur-sm animate-fade-in">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="w-16 h-16 text-destructive animate-pulse-alert" />
              <span className="text-2xl font-bold text-destructive">HELP DETECTED</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={cameraActive ? stopCamera : startCamera}
          variant={cameraActive ? "destructive" : "default"}
          className="flex-1"
        >
          {cameraActive ? (
            <><CameraOff className="w-4 h-4 mr-2" /> Stop Camera</>
          ) : (
            <><Camera className="w-4 h-4 mr-2" /> Start Camera</>
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
      )}

      {/* Gesture output */}
      {currentGesture && !isHelp && (
        <div className="glass-card p-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Detected Gesture</p>
              <p className="text-2xl font-bold text-foreground">{translatedText}</p>
              <p className="text-xs text-muted-foreground">
                {currentGesture.gesture} • {Math.round(currentGesture.confidence * 100)}% confidence
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
