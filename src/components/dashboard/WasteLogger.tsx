
'use client';

import { logFoodWaste } from '@/ai/flows/log-food-waste';
import { logFoodWasteFromAudio } from '@/ai/flows/log-food-waste-from-audio';
import { logFoodWasteFromText } from '@/ai/flows/log-food-waste-from-text';
import type { LogFoodWasteOutput } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Image as ImageIcon, Loader2, Mic, Square, Trash2, VideoOff, ArrowRight, Type, Lightbulb, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useIsMobile } from '@/hooks/use-mobile';
import { Textarea } from '../ui/textarea';


interface WasteLoggerProps {
    method: 'camera' | 'voice' | 'text';
}

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Camera Permission Effect
  useEffect(() => {
    const getCameraPermission = async () => {
      if (method !== 'camera') return;
      try {
        const constraints = {
            video: isMobile ? { facingMode: 'environment' } : true
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
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
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [method, toast, isMobile]);

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
  }
  
  const resetCapture = () => {
    setPhotoDataUri(null);
    setPhotoPreview(null);
    if(method === 'camera') {
        const getCameraPermission = async () => {
            const constraints = {
                video: isMobile ? { facingMode: 'environment' } : true
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        };
        getCameraPermission();
    }
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setPhotoDataUri(reader.result as string);
        stopCameraStream();
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
        stopCameraStream();
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

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasAudioPermission(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasAudioPermission(true);
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = handleStopRecording;
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Recording started...", description: "Speak the food items you've wasted." });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setHasAudioPermission(false);
      toast({ variant: 'destructive', title: 'Microphone Access Denied', description: 'Please enable microphone permissions.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Recording stopped", description: "Processing your voice log..."});
    }
  };

  const handleStopRecording = async () => {
    setIsLoading(true);
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const result = await logFoodWasteFromAudio({ audioDataUri: base64Audio });
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
        if(mediaRecorderRef.current) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  };

  if (method === 'camera') {
    return (
        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm border border-slate-200">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Capture Your Waste</h2>
                <p className="text-slate-500 mt-1">Point your camera at the food you've wasted.</p>
            </div>

            <div className="w-full aspect-video border-4 border-white shadow-lg rounded-2xl flex items-center justify-center bg-slate-800 overflow-hidden relative">
                {photoPreview ? (
                    <Image src={photoPreview} alt="Captured waste" layout="fill" objectFit="contain" className="shadow-lg" />
                ) : hasCameraPermission === false ? (
                    <div className="text-center p-4 text-white">
                        <Camera className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Camera Access Required</h3>
                        <p className="text-red-300">Please allow camera access in your browser settings to use this feature.</p>
                    </div>
                ) : (
                    <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                    />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="mt-6">
                {photoPreview ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button size="lg" className="h-14 text-lg" onClick={handleAnalyze} disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <ArrowRight className="w-6 h-6 mr-2" />}
                            Next: Review Items
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 text-lg bg-white" onClick={resetCapture}>
                            Retake
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button size="lg" className="h-14 text-lg bg-primary hover:bg-primary/90 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg" onClick={handleCaptureClick} disabled={!hasCameraPermission || isLoading}>
                            <Camera className="w-6 h-6 mr-2" />
                            Capture Photo
                        </Button>
                        <Button size="lg" variant="secondary" className="h-14 text-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-gray-300" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-6 h-6 mr-2" />
                            Upload
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                )}
            </div>

            <div className="mt-8 bg-white/60 rounded-xl p-4 border border-slate-200">
                 <h4 className="font-semibold text-slate-700 flex items-center mb-2"><Lightbulb className="w-4 h-4 mr-2 text-amber-500" /> Scanning Tips</h4>
                 <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                     <li>For best results, place items on a plain background.</li>
                     <li>Ensure good lighting to avoid shadows and reflections.</li>
                     <li>Try to capture all wasted items in a single photo.</li>
                 </ul>
            </div>
        </div>
    );
  }

  return (
    <Card>
      {method === 'voice' && (
        <>
           <CardHeader>
                <CardTitle>Log with Voice</CardTitle>
                <CardDescription>Press record and list your wasted items.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[250px] flex-col gap-4">
             <Button 
                type="button" 
                variant={isRecording ? 'destructive' : 'outline'} 
                className="h-24 w-24 rounded-full text-lg" 
                onClick={isRecording ? stopRecording : startRecording} 
                disabled={isLoading}>
                {isRecording ? <Square className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
            </Button>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Processing...' : isRecording ? 'Recording...' : 'Tap to record'}
            </p>
            {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}

            {hasAudioPermission === false && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Microphone Access Required</AlertTitle>
                <AlertDescription>Please allow microphone access.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </>
      )}

      {method === 'text' && (
        <>
          <CardHeader>
            <CardTitle>Log with Text</CardTitle>
            <CardDescription>Type out the items you wasted, one per line.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="e.g.&#10;1 cup of rice&#10;2 slices of bread&#10;Half an apple"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="min-h-[150px]"
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleAnalyze} disabled={isLoading || !textInput.trim()} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Next: Review Items
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
