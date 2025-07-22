
'use client';

import { logFoodWaste } from '@/ai/flows/log-food-waste';
import { logFoodWasteFromAudio } from '@/ai/flows/log-food-waste-from-audio';
import type { LogFoodWasteOutput } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getImpact, saveWasteLog } from '@/lib/data';
import type { FoodItem, User } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Image as ImageIcon, Loader2, Mic, Plus, Save, Square, Trash2, Video, VideoOff } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { auth } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const wasteLogSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'Item name is required.'),
      estimatedAmount: z.string().min(1, 'Amount is required.'),
    })
  ),
});

type WasteLogFormValues = z.infer<typeof wasteLogSchema>;

export function WasteLogger() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
  const searchParams = useSearchParams();

  const defaultTab = searchParams.get('method') || 'camera';

  const form = useForm<WasteLogFormValues>({
    resolver: zodResolver(wasteLogSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  // Camera Effect
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
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

    if(defaultTab === 'camera') {
      getCameraPermission();
    }
    
    return () => {
        // Cleanup stream on component unmount
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [defaultTab]);


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

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
  }

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

  const handleAnalyzeClick = async () => {
    if (!photoDataUri) {
      toast({ variant: 'destructive', title: 'No photo selected', description: 'Please capture or upload a photo to analyze.' });
      return;
    }
    setIsLoading(true);
    form.reset({ items: [] });
    try {
      const result: LogFoodWasteOutput = await logFoodWaste({ photoDataUri });
      processAiResult(result);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Analysis failed', description: 'An error occurred during photo analysis.' });
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
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleStopRecording;
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Recording started...", description: "Speak the food items you've wasted." });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setHasAudioPermission(false);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings.',
      });
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
    form.reset({ items: [] });
    setPhotoPreview(null);
    setPhotoDataUri(null);

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const result = await logFoodWasteFromAudio({ audioDataUri: base64Audio });
        processAiResult(result);
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

  const processAiResult = (result: LogFoodWasteOutput) => {
    if (result.items && result.items.length > 0) {
      const newItems = result.items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
      }));
      form.setValue('items', newItems);
      toast({ title: 'Analysis complete!', description: 'Review the items below and adjust as needed.' });
    } else {
      toast({ title: 'No items detected', description: 'Could not identify items. Please add them manually.' });
    }
  };
  
  const watchedItems = form.watch('items');

  const impactData = useMemo(() => {
    return watchedItems.reduce(
      (acc, item) => {
        const { peso, co2e } = getImpact(item.name);
        acc.totalPesoValue += peso;
        acc.totalCarbonFootprint += co2e;
        return acc;
      },
      { totalPesoValue: 0, totalCarbonFootprint: 0 }
    );
  }, [watchedItems]);

  const onSave = async (data: WasteLogFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not found. Please log in again.' });
      return;
    }
    setIsLoading(true);
    const finalItems: FoodItem[] = data.items.map(item => {
        const { peso, co2e } = getImpact(item.name);
        return {
            ...item,
            pesoValue: peso,
            carbonFootprint: co2e,
        }
    })

    try {
        await saveWasteLog({
          date: new Date().toISOString(),
          userId: user.uid,
          items: finalItems,
          totalPesoValue: impactData.totalPesoValue,
          totalCarbonFootprint: impactData.totalCarbonFootprint,
          photoDataUri: photoDataUri ?? undefined,
        });

        toast({ title: 'Log saved!', description: 'Your food waste has been successfully logged.' });
        router.push('/trends');
    } catch(e) {
        toast({ variant: 'destructive', title: 'Save failed', description: 'Could not save your log. Please try again.' });
    } finally {
        setIsLoading(false);
    }
  };

  const resetCapture = () => {
    setPhotoDataUri(null);
    setPhotoPreview(null);
    form.reset({items: []});
    if(defaultTab === 'camera') {
        const getCameraPermission = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({video: true});
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        };
        getCameraPermission();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Tabs defaultValue={defaultTab} className="w-full" onValueChange={(value) => router.push(`/log-waste?method=${value}`)}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera"><Camera className="mr-2"/>Camera</TabsTrigger>
                <TabsTrigger value="voice"><Mic className="mr-2"/>Voice</TabsTrigger>
            </TabsList>
            <TabsContent value="camera">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Capture Waste with Camera</CardTitle>
                        <CardDescription>Take a live photo or upload one.</CardDescription>
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
                                <AlertDescription>
                                    Please allow camera access to use this feature.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-4">
                       {photoPreview ? (
                           <>
                             <Button type="button" onClick={handleAnalyzeClick} disabled={isLoading}>
                               {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                               Analyze Photo
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
                </Card>
            </TabsContent>
            <TabsContent value="voice">
                 <Card>
                    <CardHeader>
                        <CardTitle>1. Log Waste with Voice</CardTitle>
                        <CardDescription>Press the button and speak your items.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center h-[250px]">
                        <Button type="button" variant={isRecording ? 'destructive' : 'outline'} className="h-24 w-24 rounded-full text-lg" onClick={isRecording ? stopRecording : startRecording} disabled={isLoading}>
                            {isRecording ? <Square className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                        </Button>
                        {hasAudioPermission === false && (
                           <Alert variant="destructive" className="mt-4">
                               <AlertTitle>Microphone Access Required</AlertTitle>
                               <AlertDescription>
                                   Please allow microphone access.
                               </AlertDescription>
                           </Alert>
                       )}
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle>2. Review & Adjust Items</CardTitle>
                    <CardDescription>Edit, add, or remove items detected by the AI before saving.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end">
                            <FormField control={form.control} name={`items.${index}.estimatedAmount`} render={({ field }) => (
                                <FormItem className="w-1/3">
                                    <FormLabel className="text-xs">Amount</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name={`items.${index}.name`} render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormLabel className="text-xs">Item</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {fields.length === 0 && !isLoading && (
                        <p className="text-muted-foreground text-sm text-center py-8">
                            Items will appear here after analysis.
                        </p>
                    )}
                     {isLoading && (
                        <div className="flex justify-center items-center py-8">
                             <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex-col gap-4 !pt-4 border-t">
                     <Button type="button" variant="outline" className="w-full" onClick={() => append({ id: crypto.randomUUID(), name: '', estimatedAmount: '' })}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item Manually
                    </Button>
                    <div className="w-full p-4 rounded-lg bg-secondary space-y-2 text-center">
                        <p className="font-bold text-lg">Total Impact</p>
                        <div className="flex justify-around">
                            <span>Peso Value: <span className="font-mono">₱{impactData.totalPesoValue.toFixed(2)}</span></span>
                            <span>CO₂e: <span className="font-mono">{impactData.totalCarbonFootprint.toFixed(2)}kg</span></span>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || watchedItems.length === 0}>
                        <Save className="mr-2 h-4 w-4" /> Save Log
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </form>
    </Form>
  );
}
