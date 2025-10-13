import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, Paperclip, Download, Eye, MessageSquare, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  sender_type: 'client' | 'lawyer';
  message: string;
  created_at: string;
  read_at: string | null;
  attachments?: string[];
}

interface SharedDocument {
  id: string;
  tipo_documento: string;
  titulo: string;
  materia: string;
  fecha_generacion: string;
  contenido: string;
}

interface ClientMessagingProps {
  clientId: string;
  lawyerUserId: string;
}

export const ClientMessaging = ({ clientId, lawyerUserId }: ClientMessagingProps) => {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Query messages
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['client-messages', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_messages')
        .select('*')
        .or(`sender_id.eq.${clientId},recipient_id.eq.${clientId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast({
        title: "Error",
        description: "El mensaje no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase.from('client_messages').insert({
        sender_id: user.id,
        recipient_id: lawyerUserId,
        sender_type: 'client',
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
      refetchMessages();
      
      toast({
        title: "✓ Mensaje enviado",
        description: "Tu mensaje ha sido enviado al abogado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Mensajes con tu Abogado
        </CardTitle>
        <CardDescription>
          Comunícate directamente con tu representante legal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay mensajes todavía. ¡Envía el primero!
              </p>
            )}
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender_type === 'client'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.sender_type === 'lawyer' && <User className="w-3 h-3" />}
                    <span className="text-xs opacity-70">
                      {msg.sender_type === 'client' ? 'Tú' : 'Abogado'}
                    </span>
                    <span className="text-xs opacity-70">
                      {format(new Date(msg.created_at), 'PPp', { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe tu mensaje aquí..."
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
        </div>
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" disabled>
            <Paperclip className="w-4 h-4 mr-2" />
            Adjuntar archivo
          </Button>
          <Button onClick={sendMessage} disabled={sending}>
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface SharedDocumentsProps {
  clientId: string;
}

export const SharedDocuments = ({ clientId }: SharedDocumentsProps) => {
  const { toast } = useToast();
  const [selectedDoc, setSelectedDoc] = useState<SharedDocument | null>(null);

  const { data: documents } = useQuery({
    queryKey: ['shared-documents', clientId],
    queryFn: async () => {
      // Get cases for this client
      const { data: cases } = await supabase
        .from('cases')
        .select('id')
        .eq('client_id', clientId);

      if (!cases || cases.length === 0) return [];

      const caseNumbers = cases.map(c => c.id);

      // Get documents for these cases
      const { data: docs, error } = await supabase
        .from('legal_documents')
        .select('*')
        .in('case_number', caseNumbers)
        .order('fecha_generacion', { ascending: false });

      if (error) throw error;
      return docs as SharedDocument[];
    },
  });

  const downloadDocument = (doc: SharedDocument) => {
    const blob = new Blob([doc.contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.titulo}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "✓ Descargando documento",
      description: `${doc.titulo}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Documentos Compartidos
        </CardTitle>
        <CardDescription>
          Accede a todos los documentos legales de tus casos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay documentos compartidos todavía
          </p>
        ) : (
          <div className="space-y-3">
            {documents?.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{doc.titulo}</h4>
                    <Badge variant="outline">{doc.tipo_documento}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {doc.materia} • {format(new Date(doc.fecha_generacion), 'PP', { locale: es })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>{selectedDoc?.titulo}</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[60vh]">
                        <div className="whitespace-pre-wrap p-4 bg-muted rounded-lg">
                          {selectedDoc?.contenido}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadDocument(doc)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface AccountSummaryProps {
  summary: {
    totalFacturado: number;
    totalPagado: number;
    saldoPendiente: number;
  };
  invoices: any[];
}

export const AccountSummary = ({ summary, invoices }: AccountSummaryProps) => {
  const { toast } = useToast();

  const downloadStatement = () => {
    // Generate simple text statement
    let statement = `ESTADO DE CUENTA\n`;
    statement += `Generado: ${format(new Date(), 'PPP', { locale: es })}\n\n`;
    statement += `Total Facturado: $${summary.totalFacturado.toFixed(2)}\n`;
    statement += `Total Pagado: $${summary.totalPagado.toFixed(2)}\n`;
    statement += `Saldo Pendiente: $${summary.saldoPendiente.toFixed(2)}\n\n`;
    statement += `FACTURAS:\n`;
    statement += `=========\n`;
    
    invoices?.forEach(inv => {
      statement += `\n${inv.numero_factura} - ${inv.concepto}\n`;
      statement += `Fecha: ${format(new Date(inv.fecha), 'PP', { locale: es })}\n`;
      statement += `Monto: $${inv.monto}\n`;
      statement += `Estado: ${inv.estado}\n`;
    });

    const blob = new Blob([statement], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estado-cuenta-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "✓ Descargando estado de cuenta",
      description: "El archivo se ha descargado correctamente",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resumen de Cuenta</span>
          <Button variant="outline" size="sm" onClick={downloadStatement}>
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
        </CardTitle>
        <CardDescription>
          Estado financiero de tus servicios legales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Facturado</p>
              <p className="text-2xl font-bold">${summary.totalFacturado.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Pagado</p>
              <p className="text-2xl font-bold text-success">${summary.totalPagado.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
              <p className={`text-2xl font-bold ${summary.saldoPendiente > 0 ? 'text-destructive' : 'text-success'}`}>
                ${summary.saldoPendiente.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Facturas Recientes</h4>
            {invoices?.slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <p className="font-medium text-sm">{inv.numero_factura}</p>
                  <p className="text-xs text-muted-foreground">{inv.concepto}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${inv.monto}</p>
                  <Badge variant={inv.estado === 'pagado' ? 'default' : 'secondary'} className="text-xs">
                    {inv.estado}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
