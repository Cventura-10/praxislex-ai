import { useState } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatIA } from "./ChatIA";

export function FloatingAIWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          size="icon"
        >
          <Sparkles className="h-6 w-6" />
          <span className="sr-only">Asistente IA</span>
        </Button>
      )}

      {/* Chat widget */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-md shadow-2xl animate-in slide-in-from-bottom-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Asistente IA
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px]">
              <ChatIA />
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
