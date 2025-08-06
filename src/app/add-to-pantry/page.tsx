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
  Loader2,
  Square
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
    const checkCameraPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setHasCameraPermission(result.state === 'granted');
      } catch {
        setHasCameraPermission(false);
      }
    };

    const checkAudioPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setHasAudioPermission(result.state === 'granted');
      } catch {
        setHasAudioPermission(false);
      }
    };

    checkCameraPermission();
    checkAudioPermission();
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasCameraPermission(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Camera access denied', description: 'Please allow camera access to use this feature.' });
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
        
        // Stop camera stream
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
      setHasAudioPermission(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      setHasAudioPermission(false);
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

  return (
    <div className="min-h-screen bg-[#F7F7F7] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-4xl font-semibold text-[#063627]">Add to Pantry</h1>
            <Sparkles className="w-8 h-8 text-[#FFDD00]" />
          </div>
          <p className="text-[#7C7C7C] text-lg">Log your new groceries using your camera, voice, or by typing.</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-700">Items Added Today</p>
                  <p className="text-3xl font-semibold text-pink-900">12</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Waste Reduced</p>
                  <p className="text-3xl font-semibold text-green-900">85%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Expiring Soon</p>
                  <p className="text-3xl font-semibold text-yellow-900">3</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Method Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { 
              icon: Camera, 
              label: "Camera", 
              method: "camera", 
              description: "Scan items instantly",
              bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
              iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500"
            },
            { 
              icon: Mic, 
              label: "Voice", 
              method: "voice", 
              description: "Speak your groceries",
              bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
              iconBg: "bg-gradient-to-br from-purple-500 to-pink-500"
            },
            { 
              icon: Type, 
              label: "Text", 
              method: "text", 
              description: "Type manually",
              bgColor: "bg-gradient-to-br from-orange-50 to-red-50",
              iconBg: "bg-gradient-to-br from-orange-500 to-red-500"
            }
          ].map((item) => (
            <Card 
              key={item.method}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md border-2 ${
                selectedMethod === item.method 
                  ? "border-[#227D53] shadow-lg shadow-[#227D53]/25" 
                  : "border-gray-200 hover:border-gray-300"
              } ${item.bgColor}`}
              onClick={() => setSelectedMethod(item.method)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="font-semibold text-[#063627] text-lg mb-1">{item.label}</h3>
                <p className="text-[#7C7C7C] text-sm">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Area Based on Selected Method */}
        {selectedMethod === 'camera' && (
          <div className="space-y-6">
            {/* Camera Preview */}
            <Card className="border-2 border-dashed border-[#A3A9A7]/30 shadow-sm">
              <CardContent className="p-12">
                {photoPreview ? (
                  <div className="text-center">
                    <Image src={photoPreview} alt="Captured" width={400} height={300} className="mx-auto rounded-xl shadow-lg" />
                    <Button 
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoDataUri('');
                      }}
                      variant="outline"
                      className="mt-4"
                    >
                      Retake Photo
                    </Button>
                  </div>
                ) : hasCameraPermission === false ? (
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
                      <Camera className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#063627] mb-2">Camera Access Required</h3>
                    <p className="text-[#A3A9A7] mb-4">Please allow camera access to use this feature</p>
                    <Button onClick={startCamera} className="bg-gradient-to-r from-[#063627] to-[#227D53]">
                      Enable Camera
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <video 
                      ref={videoRef} 
                      className="mx-auto rounded-xl shadow-lg max-w-full h-auto"
                      style={{ maxHeight: '400px' }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {hasCameraPermission && (
                      <Button 
                        onClick={capturePhoto}
                        className="mt-4 bg-gradient-to-r from-[#063627] to-[#227D53]"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        Capture Photo
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className="flex-1 bg-gradient-to-r from-[#063627] to-[#227D53] hover:from-[#063627]/90 hover:to-[#227D53]/90 shadow-lg shadow-[#227D53]/25 h-14 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02]"
                onClick={() => photoPreview ? handleAnalyze('camera', photoDataUri) : startCamera()}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Camera className="w-5 h-5 mr-2" />}
                {photoPreview ? 'Analyze Photo' : 'Start Camera'}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="flex-1 border-2 border-[#A3A9A7] hover:border-[#227D53] hover:bg-[#227D53]/10 h-14 text-lg font-semibold rounded-lg transition-all duration-200"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        )}

        {selectedMethod === 'voice' && (
          <div className="space-y-6">
            <Card className="border-2 border-dashed border-[#A3A9A7]/30 shadow-sm">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg ${
                    isRecording 
                      ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}>
                    <Mic className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#063627] mb-2">
                    {isRecording ? 'Recording...' : 'Voice Recording'}
                  </h3>
                  <p className="text-[#A3A9A7]">
                    {isRecording ? 'Speak clearly about your groceries' : 'Click record to start voice input'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                size="lg" 
                className={`flex-1 h-14 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                  isRecording 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                    : 'bg-gradient-to-r from-[#063627] to-[#227D53] hover:from-[#063627]/90 hover:to-[#227D53]/90'
                } shadow-lg shadow-[#227D53]/25`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || hasAudioPermission === false}
              >
                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 
                 isRecording ? <Square className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </div>
          </div>
        )}

        {selectedMethod === 'text' && (
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <Textarea
                  placeholder="Type your groceries here... (e.g., 2 kg rice, 1 dozen eggs, 500g chicken breast)"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="min-h-[200px] text-lg border-2 border-[#A3A9A7]/30 focus:border-[#227D53] rounded-xl"
                />
              </CardContent>
            </Card>

            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-[#063627] to-[#227D53] hover:from-[#063627]/90 hover:to-[#227D53]/90 shadow-lg shadow-[#227D53]/25 h-14 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={handleTextSubmit}
              disabled={isLoading || !textInput.trim()}
            >
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ArrowRight className="w-5 h-5 mr-2" />}
              Analyze Text
            </Button>
          </div>
        )}

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* AI Insights Card */}
          <Card className="bg-gradient-to-br from-[#063627] to-[#227D53] text-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FFDD00]" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 mb-4">Based on your patterns, you typically add fresh produce on weekends. Consider bulk buying to reduce packaging waste.</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#FFDD00]" />
                <span className="text-sm text-white/80">Sustainability tip applied</span>
              </div>
            </CardContent>
          </Card>

          {/* Progress Tracking */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#063627]">Monthly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#7C7C7C]">Items Added</span>
                    <span className="font-semibold text-[#063627]">156/200</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#7C7C7C]">Waste Reduction</span>
                    <span className="font-semibold text-[#063627]">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}