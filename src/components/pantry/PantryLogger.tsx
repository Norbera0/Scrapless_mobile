
'use client';

import { logPantryItem } from '@/ai/flows/log-pantry-item';
import type { LogPantryItemOutput } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Camera, Image as ImageIcon, Loader2, Mic, Square, Trash2, VideoOff, ArrowRight, Type } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { usePantryLogStore } from '@/stores/pantry-store';
import { Textarea } from '../ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';


export function PantryLogger() {
  const [isLoading, setIsLoading] = useState(false);
  const {
      photoDataUri, setPhotoDataUri,
      textInput, setTextInput,
      setItems
  } = usePantryLogStore();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  // Camera Permission Effect
  useEffect(() => {
    const getCameraPermission = async () => {
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
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [isMobile]);

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
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            handleAnalyze('voice', reader.result as string);
        }
      };
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Recording started...", description: "List your new grocery items." });
    } catch (err) {
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
  
  return (
    <Card>
      <Tabs defaultValue="camera" className="w-full">
        <CardHeader>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="camera"><Camera className='mr-2' />Camera</TabsTrigger>
              <TabsTrigger value="voice"><Mic className='mr-2'/>Voice</TabsTrigger>
              <TabsTrigger value="text"><Type className='mr-2'/>Text</TabsTrigger>
            </TabsList>
        </CardHeader>
        <TabsContent value="camera">
          <CardContent className="space-y-4">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center bg-muted overflow-hidden">
              {photoPreview ? (
                <Image src={photoPreview} alt="Pantry item preview" width={400} height={225} className="object-cover w-full h-full" />
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
            <div className="grid grid-cols-2 gap-4">
                {!photoPreview ? (
                    <>
                        <Button onClick={handleCaptureClick} disabled={!hasCameraPermission}>
                            <Camera className="mr-2" /> Capture
                        </Button>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="mr-2" /> Upload
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={() => photoDataUri && handleAnalyze('camera', photoDataUri)} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <ArrowRight className="mr-2" />}
                            Next: Review Items
                        </Button>
                        <Button variant="outline" onClick={resetCapture}>
                            <Trash2 className="mr-2" /> Retake
                        </Button>
                    </>
                )}
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="voice">
            <CardContent className="flex justify-center items-center h-[250px] flex-col gap-4">
                <p className='text-center text-muted-foreground'>Press the button and say what you bought. <br/> For example: "3 apples, 1 liter of milk, and a loaf of bread".</p>
                <Button 
                    type="button" 
                    variant={isRecording ? 'destructive' : 'outline'} 
                    className="h-24 w-24 rounded-full text-lg" 
                    onClick={isRecording ? stopRecording : startRecording} 
                    disabled={isLoading}>
                    {isRecording ? <Square className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                </Button>
                {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                {hasAudioPermission === false && (
                <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Microphone Access Required</AlertTitle>
                    <AlertDescription>Please allow microphone access.</AlertDescription>
                </Alert>
                )}
            </CardContent>
        </TabsContent>
        
        <TabsContent value="text">
            <CardContent className="space-y-4">
                <Textarea 
                    placeholder="Type or paste your grocery list here. e.g.&#10;1kg chicken breast&#10;2 loaves of bread&#10;5 bananas"
                    rows={8}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                />
                 <Button onClick={() => handleAnalyze('text', textInput)} disabled={isLoading || !textInput}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <ArrowRight className="mr-2" />}
                    Next: Review Items
                </Button>
            </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
