
'use client';

import { logFoodWaste } from '@/ai/flows/log-food-waste';
import { logFoodWasteFromAudio } from '@/ai/flows/log-food-waste-from-audio';
import type { LogFoodWasteOutput } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Image as ImageIcon, Loader2, Mic, Square, Trash2, VideoOff, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useIsMobile } from '@/hooks/use-mobile';


interface WasteLoggerProps {
    method: 'camera' | 'voice';
}

export function WasteLogger({ method }: WasteLoggerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
      photoPreview, setPhotoPreview,
      photoDataUri, setPhotoDataUri,
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

  return (
    <Card>
      {method === 'camera' && (
        <>
          <CardHeader>
            <CardTitle>Log with Camera</CardTitle>
            <CardDescription>Take a live photo or upload one of your food waste.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center bg-muted overflow-hidden">
              {photoPreview ? (
                <Image src={photoPreview} alt="Food waste preview" width={400} height={225} className="object-cover w-full h-full" />
              ) : (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              )}
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <VideoOff className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="grid grid-cols-2 gap-4">
            {photoPreview ? (
              <>
                <Button type="button" onClick={handleAnalyze} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Next: Review Items
                </Button>
                <Button type="button" variant="outline" onClick={resetCapture}>
                  <Trash2 className="mr-2 h-4 w-4" /> Retake
                </Button>
              </>
            ) : (
              <>
                <Button type="button" onClick={handleCaptureClick} disabled={!hasCameraPermission}>
                  <Camera className="mr-2 h-4 w-4" /> Capture Photo
                </Button>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="mr-2 h-4 w-4" /> Upload
                </Button>
              </>
            )}
          </CardFooter>
        </>
      )}

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
    </Card>
  );
}
