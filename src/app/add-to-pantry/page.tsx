
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { logPantryItem } from '@/ai/flows/log-pantry-item';
import { 
  Camera, 
  Mic, 
  Type, 
  Upload, 
  AlertCircle, 
  Sparkles, 
  Package, 
  TrendingUp, 
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Square,
  BarChart3,
  Lightbulb,
  Receipt,
  RefreshCw
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const NUM_WAVEFORM_BARS = 30;

export default function AddToPantryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const resetStore = usePantryLogStore((state) => state.reset);
  const { 
    photoDataUri, 
    setPhotoDataUri,
    textInput, 
    setTextInput,
    setItems 
  } = usePantryLogStore();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // For waveform visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    resetStore();
    const methodFromQuery = searchParams.get('method');
    if (methodFromQuery && ['camera', 'voice', 'text'].includes(methodFromQuery)) {
        setSelectedMethod(methodFromQuery);
    }
  }, [resetStore, searchParams]);

  // Camera Permission Effect
  useEffect(() => {
    if (selectedMethod !== 'camera' || photoPreview) return;

    let stream: MediaStream | null = null;
    
    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch {
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
        // Stop all tracks of the stream
        if (videoRef.current && videoRef.current.srcObject) {
            const currentStream = videoRef.current.srcObject as MediaStream;
            currentStream.getTracks().forEach(track => track.stop());
        }
    }
  }, [selectedMethod, photoPreview, facingMode]);

   useEffect(() => {
     if (selectedMethod !== 'voice') return;

    const checkAudioPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasAudioPermission(true);
      } catch {
        setHasAudioPermission(false);
      }
    };

    checkAudioPermission();
  }, [selectedMethod]);

  // Waveform Cleanup
  useEffect(() => {
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    }
  }, []);


  const handleAnalyze = async (source: 'camera' | 'voice' | 'text', data: string) => {
    setIsLoading(true);
    try {
      const result = await logPantryItem({ source, data });
      
      if (result && result.items && result.items.length > 0) {
        const newItems = result.items.map((item) => ({ ...item, id: crypto.randomUUID() }));
        setItems(newItems);
        toast({ title: 'Analysis complete!', description: 'Please review the detected items.' });
        router.push('/review-pantry-items');
      } else {
        toast({ title: 'No items detected', description: 'Could not identify items. Please review and add them manually.' });
        setItems([]);
        router.push('/review-pantry-items');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Analysis failed', description: 'An error occurred during analysis.' });
    } finally {
      setIsLoading(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUri = canvas.toDataURL('image/jpeg');
        setPhotoDataUri(dataUri);
        setPhotoPreview(dataUri);
        
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setPhotoDataUri(dataUri);
        setPhotoPreview(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const visualize = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const newWaveform = Array(NUM_WAVEFORM_BARS).fill(0);
    const barWidth = Math.floor(dataArrayRef.current.length / NUM_WAVEFORM_BARS);

    for (let i = 0; i < NUM_WAVEFORM_BARS; i++) {
        let sum = 0;
        for (let j = 0; j < barWidth; j++) {
            sum += dataArrayRef.current[i * barWidth + j];
        }
        let average = sum / barWidth;
        newWaveform[i] = (average / 255);
    }
    setWaveform(newWaveform);

    animationFrameRef.current = requestAnimationFrame(visualize);
  }, []);

  const startRecording = async () => {
    if (hasAudioPermission === false) {
        toast({ variant: 'destructive', title: 'Microphone access denied', description: 'Please allow microphone access to use this feature.' });
        return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        setWaveform(Array(NUM_WAVEFORM_BARS).fill(0));

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          handleAnalyze('voice', base64Audio);
        };
        reader.readAsDataURL(audioBlob);
      };

      // Setup Web Audio API for visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      visualize();

    } catch (error) {
      console.error('Microphone access denied:', error);
      toast({ variant: 'destructive', title: 'Microphone access denied', description: 'Please allow microphone access to use this feature.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleAnalyze('text', textInput);
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (selectedMethod) {
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => setSelectedMethod(null)} className="mb-2 -ml-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                {selectedMethod === 'camera' && (
                    <div className="w-full">
                        <div className="w-full aspect-[9/16] sm:aspect-video border-4 border-white shadow-lg rounded-2xl flex items-center justify-center bg-slate-800 overflow-hidden relative">
                            {photoPreview ? (
                                <Image src={photoPreview} alt="Captured" layout="fill" objectFit="contain" />
                            ) : hasCameraPermission === false ? (
                                <div className="text-center p-4 text-white">
                                    <Camera className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-white mb-2">Camera Access Required</h3>
                                    <p className="text-red-300">Please allow camera access in your browser settings to use this feature.</p>
                                </div>
                            ) : (
                                <>
                                    <video 
                                        ref={videoRef} 
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        playsInline
                                        muted
                                    />
                                    {!photoPreview && (
                                        <div className="absolute inset-x-0 bottom-6 flex justify-center items-center gap-8">
                                             <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-14 h-14 rounded-full bg-black/50 hover:bg-black/70"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isLoading}
                                            >
                                                <Upload className="w-6 h-6 text-white" />
                                            </Button>

                                            <Button 
                                                className="w-20 h-20 bg-white rounded-full p-2 border-4 border-white/50 hover:bg-gray-200"
                                                onClick={capturePhoto}
                                                disabled={!hasCameraPermission || isLoading}
                                                aria-label="Capture photo"
                                            >
                                                <div className="w-full h-full bg-white rounded-full ring-2 ring-inset ring-black"></div>
                                            </Button>
                                            
                                             <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-14 h-14 rounded-full bg-black/50 hover:bg-black/70"
                                                onClick={handleFlipCamera}
                                                disabled={isLoading}
                                            >
                                                <RefreshCw className="w-6 h-6 text-white" />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        </div>
                        
                        <div className="mt-4">
                            {photoPreview && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Button size="lg" onClick={() => photoDataUri && handleAnalyze('camera', photoDataUri)} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ArrowRight className="w-5 h-5 mr-2" />}
                                        Analyze Photo
                                    </Button>
                                    <Button size="lg" variant="outline" className="bg-white" onClick={() => { setPhotoPreview(null); setPhotoDataUri(''); }}>
                                        Retake
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                 {selectedMethod === 'voice' && (
                    <Card>
                        <CardHeader className='text-center'>
                            <CardTitle className='text-2xl font-bold text-gray-800'>Voice Entry</CardTitle>
                            <p className='text-muted-foreground'>Add items to your pantry using voice commands</p>
                        </CardHeader>
                        <CardContent className="space-y-6 text-center flex flex-col items-center justify-center p-8 min-h-[350px]">
                            {/* Waveform Visualization */}
                            <div className="h-20 w-full flex items-center justify-center gap-1">
                                {waveform.map((height, i) => (
                                    <div
                                        key={i}
                                        className="w-1 rounded-full bg-primary/80"
                                        style={{
                                            height: `${Math.max(4, height * 100)}%`,
                                            transition: 'height 0.1s ease-out'
                                        }}
                                    />
                                ))}
                            </div>

                             <div className='h-16'>
                                <h3 className="text-xl font-semibold text-gray-800">
                                    {isLoading ? 'Processing...' : isRecording ? 'Listening...' : 'Ready to record'}
                                </h3>
                                <p className="text-muted-foreground">
                                     {isLoading
                                        ? 'Converting speech to text...'
                                        : isRecording
                                        ? formatTime(recordingTime)
                                        : 'Tap the button to start recording.'}
                                </p>
                             </div>
                             <Button 
                                size="lg" 
                                variant={isRecording ? 'destructive' : 'default'}
                                className="w-full h-14 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02]"
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : 
                                isRecording ? <Square className="w-6 h-6 mr-2" /> : <Mic className="w-6 h-6 mr-2" />}
                                {isLoading ? "Analyzing..." : isRecording ? 'Stop Recording' : 'Start Recording'}
                            </Button>
                        </CardContent>
                        <div className="p-6 pt-0">
                            <div className="bg-secondary/50 rounded-xl p-4 border">
                                <h4 className="font-semibold text-foreground flex items-center mb-2"><Lightbulb className="w-4 h-4 mr-2 text-amber-500" /> Recording Tips</h4>
                                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside text-left">
                                    <li>Speak clearly and at a natural pace.</li>
                                    <li>Say both the item and quantity (e.g., "2 kilos of rice").</li>
                                    <li>List items one after another (e.g., "1 dozen eggs and 5 bananas").</li>
                                    <li>No need to rush, you can pause between items.</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                )}
                 {selectedMethod === 'text' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Manual Entry</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Type your groceries here... e.g.,&#10;2 kg rice&#10;1 dozen eggs&#10;500g chicken breast"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                className="min-h-[200px] text-base"
                            />
                            <Button 
                                size="lg" 
                                className="w-full"
                                onClick={handleTextSubmit}
                                disabled={isLoading || !textInput.trim()}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ArrowRight className="w-5 h-5 mr-2" />}
                                Analyze Text
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Add to Pantry ✨</h1>
          <p className="text-lg text-gray-500">Choose your preferred way to add groceries</p>
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-pink-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-900">12</p>
                  <p className="text-sm font-medium text-pink-700">Added Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900">85%</p>
                  <p className="text-sm font-medium text-green-700">Waste Reduced</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-900">3</p>
                  <p className="text-sm font-medium text-yellow-700">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Input Method Cards */}
        <div className="mb-8">
            <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">How would you like to add items?</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* Camera Card - Primary */}
            <Card className="border border-gray-200 transform hover:scale-[1.02] transition-transform duration-300 flex flex-col hover:shadow-md hover:-translate-y-1">
              <CardContent className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-4xl">📷</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Scan with Camera</h3>
                <p className="text-gray-500 mb-6">Point at items for instant recognition.</p>
                <Button className="w-full mt-auto bg-blue-500 hover:bg-blue-600" onClick={() => setSelectedMethod('camera')}>Start Scanning</Button>
              </CardContent>
            </Card>

            {/* Voice Card - Secondary */}
            <Card className="border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <CardContent className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-3xl">🎤</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Voice Entry</h3>
                <p className="text-gray-500 mb-6 text-sm">Say item names naturally.</p>
                <Button className="w-full mt-auto bg-purple-500 hover:bg-purple-600" onClick={() => setSelectedMethod('voice')}>Start Recording</Button>
              </CardContent>
            </Card>

            {/* Text Card - Tertiary */}
            <Card className="border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <CardContent className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-3xl">⌨️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Manual Entry</h3>
                <p className="text-gray-500 mb-6 text-sm">Add items by typing.</p>
                <Button className="w-full mt-auto bg-orange-500 hover:bg-orange-600" onClick={() => setSelectedMethod('text')}>Start Typing</Button>
              </CardContent>
            </Card>
            </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-primary text-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-yellow-300" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-200 mb-4">Based on your patterns, you typically add fresh produce on weekends. Consider bulk buying to reduce packaging waste.</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Sustainability tip applied</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">This Month's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Items Added</span>
                    <span className="font-semibold text-gray-800">156/200</span>
                  </div>
                  <Progress value={78} className="h-2 [&>div]:bg-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Waste Reduction</span>
                    <span className="font-semibold text-green-600">85%</span>
                  </div>
                  <Progress value={85} className="h-2 [&>div]:bg-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
