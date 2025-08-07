
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  BarChart3
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

export default function AddToPantryPage() {
  const router = useRouter();
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    resetStore();
  }, [resetStore]);

  // Camera Permission Effect
  useEffect(() => {
    if (selectedMethod !== 'camera') return;

    const checkCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch {
        setHasCameraPermission(false);
      }
    };

    checkCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [selectedMethod]);

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          handleAnalyze('voice', base64Audio);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      toast({ variant: 'destructive', title: 'Microphone access denied', description: 'Please allow microphone access to use this feature.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleAnalyze('text', textInput);
    }
  };

  if (selectedMethod) {
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <Button variant="ghost" onClick={() => setSelectedMethod(null)} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to methods
                </Button>
                {selectedMethod === 'camera' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Scan with Camera</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                            {photoPreview ? (
                                <Image src={photoPreview} alt="Captured" width={400} height={300} className="mx-auto rounded-xl shadow-lg object-contain h-full w-full" />
                            ) : hasCameraPermission === false ? (
                                <div className="text-center p-4">
                                    <Camera className="w-12 h-12 text-destructive mx-auto mb-2" />
                                    <h3 className="text-xl font-semibold text-destructive mb-2">Camera Access Required</h3>
                                    <p className="text-muted-foreground">Please allow camera access in your browser settings to use this feature.</p>
                                </div>
                            ) : (
                                <video 
                                    ref={videoRef} 
                                    className="mx-auto rounded-xl shadow-lg max-w-full h-auto"
                                    autoPlay
                                    playsInline
                                    muted
                                />
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                            </div>
                            <div className="flex gap-4">
                                {photoPreview ? (
                                     <>
                                        <Button className="flex-1" onClick={() => photoDataUri && handleAnalyze('camera', photoDataUri)} disabled={isLoading}>
                                            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ArrowRight className="w-5 h-5 mr-2" />}
                                            Analyze Photo
                                        </Button>
                                        <Button variant="outline" className="flex-1" onClick={() => { setPhotoPreview(null); setPhotoDataUri(''); }}>
                                            Retake
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button className="flex-1" onClick={capturePhoto} disabled={!hasCameraPermission || isLoading}>
                                            <Camera className="w-5 h-5 mr-2" />
                                            Capture Photo
                                        </Button>
                                        <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="w-5 h-5 mr-2" />
                                            Upload
                                        </Button>
                                         <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
                 {selectedMethod === 'voice' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Voice Entry</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-center">
                             <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center shadow-lg transition-all ${
                                isRecording 
                                ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse' 
                                : 'bg-gradient-to-br from-purple-500 to-pink-500'
                            }`}>
                                <Mic className="w-16 h-16 text-white" />
                            </div>
                             <h3 className="text-xl font-semibold text-gray-800">
                                {isLoading ? 'Processing...' : isRecording ? 'Recording...' : 'Ready to record'}
                            </h3>
                            <p className="text-muted-foreground">
                                {isLoading ? 'Please wait a moment.' : isRecording ? 'Tap the button to stop.' : 'Tap the button and say your items.'}
                            </p>
                             <Button 
                                size="lg" 
                                className={`w-full h-14 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                                isRecording 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : 
                                isRecording ? <Square className="w-6 h-6 mr-2" /> : <Mic className="w-6 h-6 mr-2" />}
                                {isLoading ? "Analyzing..." : isRecording ? 'Stop Recording' : 'Start Recording'}
                            </Button>
                        </CardContent>
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
            <Card className="border border-gray-200 shadow-lg transform hover:scale-105 transition-transform duration-300 flex flex-col">
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
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Type Manually</h3>
                <p className="text-gray-500 mb-6 text-sm">Add items by typing.</p>
                <Button className="w-full mt-auto bg-orange-500 hover:bg-orange-600" onClick={() => setSelectedMethod('text')}>Start Typing</Button>
              </CardContent>
            </Card>
            </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-gradient-to-br from-green-900 to-green-800 text-white shadow-lg">
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

    