
'use client';

import { logFoodWaste } from '@/ai/flows/log-food-waste';
import { logFoodWasteFromAudio } from '@/ai/flows/log-food-waste-from-audio';
import { logFoodWasteFromText } from '@/ai/flows/log-food-waste-from-text';
import type { LogFoodWasteOutput } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Image as ImageIcon, Loader2, Mic, Square, Trash2, VideoOff, ArrowRight, Type, Lightbulb, Upload, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useIsMobile } from '@/hooks/use-mobile';
import { Textarea } from '../ui/textarea';


interface WasteLoggerProps {
    method: 'camera' | 'voice' | 'text';
}

const NUM_WAVEFORM_BARS = 30;

export function WasteLogger({ method }: WasteLoggerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
      photoPreview, setPhotoPreview,
      photoDataUri, setPhotoDataUri,
      textInput, setTextInput,
      setItems
  } = useWasteLogStore();

  const [isRecording, setIsRecording] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
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
  const [waveform, setWaveform] = useState<number[]>(Array(NUM_WAVEFORM_BARS).fill(0));
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);


  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Camera Permission Effect
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const getCameraPermission = async () => {
      if (method !== 'camera' || photoPreview) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions to use this feature.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [method, toast, facingMode, photoPreview]);
  
  // Audio Permission Check Effect
  useEffect(() => {
    if (method !== 'voice') return;
    const checkAudioPermission = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setHasAudioPermission(true);
        } catch {
            setHasAudioPermission(false);
        }
    };
    checkAudioPermission();
  }, [method]);

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
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setPhotoDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCaptureClick = () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if(context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = canvas.toDataURL('image/jpeg');
        setPhotoPreview(dataUri);
        setPhotoDataUri(dataUri);
      }
  }

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      let result: LogFoodWasteOutput | null = null;
      if (method === 'camera' && photoDataUri) {
        result = await logFoodWaste({ photoDataUri });
      } else if (method === 'text' && textInput) {
        result = await logFoodWasteFromText({ text: textInput });
      }
      
      if (result && result.items && result.items.length > 0) {
        const newItems = result.items.map((item) => ({ ...item, id: crypto.randomUUID() }));
        setItems(newItems);
        toast({ title: 'Analysis complete!', description: 'Please review the detected items.' });
        router.push('/review-items');
      } else {
        toast({ title: 'No items detected', description: 'Could not identify items. Please review and add them manually.' });
        setItems([]);
        router.push('/review-items');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Analysis failed', description: 'An error occurred during analysis.' });
    } finally {
      setIsLoading(false);
    }
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
  
  const handleVoiceAnalysis = async (audioDataUri: string) => {
    setIsLoading(true);
    try {
      const result = await logFoodWasteFromAudio({ audioDataUri });
      if (result && result.items && result.items.length > 0) {
        const newItems = result.items.map((item) => ({ ...item, id: crypto.randomUUID() }));
        setItems(newItems);
        toast({ title: 'Analysis complete!', description: 'Please review the detected items.' });
        router.push('/review-items');
      } else {
        toast({ title: 'No items detected', description: 'Could not identify items. Please review and add them manually.' });
        setItems([]);
        router.push('/review-items');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Voice analysis failed', description: 'Could not process the audio.' });
    } finally {
      setIsLoading(false);
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };


  const startRecording = async () => {
    if (hasAudioPermission === false) {
        toast({ variant: 'destructive', title: 'Microphone access denied', description: 'Please allow microphone access to use this feature.' });
        return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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
          handleVoiceAnalysis(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
      };

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
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (method === 'camera') {
    return (
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
                                    onClick={handleCaptureClick}
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
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
            
            <div className="mt-4">
                {photoPreview && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button size="lg" onClick={handleAnalyze} disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ArrowRight className="w-5 h-5 mr-2" />}
                            Analyze Photo
                        </Button>
                        <Button size="lg" variant="outline" className="bg-white" onClick={() => { setPhotoPreview(null); setPhotoDataUri(''); }}>
                            Retake
                        </Button>
                    </div>
                )}
            </div>

            <div className="mt-6 bg-secondary/50 rounded-xl p-4 border">
                 <h4 className="font-semibold text-foreground flex items-center mb-2"><Lightbulb className="w-4 h-4 mr-2 text-amber-500" /> Scanning Tips</h4>
                 <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                     <li>For best results, place items on a plain background.</li>
                     <li>Ensure good lighting to avoid shadows and reflections.</li>
                     <li>Try to capture all wasted items in a single photo.</li>
                 </ul>
            </div>
        </div>
    );
  }

  if (method === 'voice') {
      return (
          <Card>
              <CardHeader className='text-center'>
                  <CardTitle className='text-2xl font-bold text-gray-800'>Log with Voice</CardTitle>
                  <CardDescription>Press record and list your wasted items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-center flex flex-col items-center justify-center p-8 min-h-[350px]">
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
                              ? 'Analyzing your speech...'
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
                  {hasAudioPermission === false && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTitle>Microphone Access Required</AlertTitle>
                      <AlertDescription>Please allow microphone access.</AlertDescription>
                    </Alert>
                  )}
              </CardContent>
               <div className="p-6 pt-0">
                  <div className="bg-secondary/50 rounded-xl p-4 border">
                      <h4 className="font-semibold text-foreground flex items-center mb-2"><Lightbulb className="w-4 h-4 mr-2 text-amber-500" /> Recording Tips</h4>
                      <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside text-left">
                          <li>Speak clearly, for example: "I wasted one cup of rice".</li>
                          <li>Say both the item and quantity for best results.</li>
                          <li>You can list multiple items, like "two slices of pizza and three bananas".</li>
                      </ul>
                  </div>
              </div>
          </Card>
      )
  }

  if (method === 'text') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Log with Text</CardTitle>
            <CardDescription>Type out the items you wasted, one per line.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="e.g.&#10;1 cup of rice&#10;2 slices of bread&#10;Half an apple"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="min-h-[200px] text-base"
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleAnalyze} disabled={isLoading || !textInput.trim()} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Next: Review Items
            </Button>
          </CardFooter>
        </Card>
      )
  }

  return null;
}

    