import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onTranscribed: (text: string) => void;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export const VoiceInput = ({ onTranscribed, className, size = "sm" }: VoiceInputProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        throw new Error('Entorno no soportado');
      }
      if (typeof MediaRecorder === 'undefined') {
        toast({
          title: 'Dictado no soportado',
          description: 'Tu navegador no soporta grabación de audio.',
          variant: 'destructive',
        });
        return;
      }

      const getBestMimeType = () => {
        const candidates = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          'audio/mpeg'
        ];
        for (const t of candidates) {
          try { if ((MediaRecorder as any).isTypeSupported?.(t)) return t; } catch {}
        }
        return '';
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chosenType = getBestMimeType();
      if (!chosenType) {
        toast({
          title: 'Dictado no soportado',
          description: 'No se encontró un formato de audio compatible.',
          variant: 'destructive',
        });
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: chosenType });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || chosenType });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      toast({
        title: 'Grabando',
        description: 'Dicta la información...',
      });
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      toast({
        title: 'Error',
        description: 'No se pudo acceder al micrófono',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];

          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audio: base64Audio, mimeType: (audioBlob as any)?.type || 'audio/webm' },
          });

          if (error) {
            const msg = error.message || '';
            if (msg.includes('401')) {
              toast({
                title: "Configuración requerida",
                description: "La API de voz no está configurada.",
                variant: "destructive",
              });
              return;
            }
            if (msg.includes('429')) {
              toast({
                title: "Límite excedido",
                description: "Intenta más tarde.",
                variant: "destructive",
              });
              return;
            }
            throw error;
          }

          if (data?.error) {
            toast({
              title: "Error",
              description: data.error,
              variant: "destructive",
            });
            return;
          }

          if (data?.text) {
            onTranscribed(data.text);
            toast({
              title: "✓ Transcripción completa",
              description: `${data.text.length} caracteres transcritos`,
            });
          }
        } catch (err: any) {
          console.error('Error en transcripción:', err);
          toast({
            title: "Error",
            description: err?.message || "No se pudo transcribir el audio",
            variant: "destructive",
          });
        } finally {
          setIsTranscribing(false);
        }
      };
    } catch (error) {
      console.error('Error preparando transcripción:', error);
      toast({
        title: "Error",
        description: "No se pudo preparar el audio",
        variant: "destructive",
      });
      setIsTranscribing(false);
    }
  };

  const buttonSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      className={cn(buttonSize, className)}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isTranscribing}
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};
