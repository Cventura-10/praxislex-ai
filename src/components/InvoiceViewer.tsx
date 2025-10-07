import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, X, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import './InvoiceViewer.css';

interface InvoiceViewerProps {
  open: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    numero_factura: string;
    concepto: string;
    monto: number;
    fecha: string;
    estado: string;
    clients?: {
      nombre_completo: string;
      cedula_rnc?: string;
      email?: string;
      telefono?: string;
      direccion?: string;
    };
  };
  lawFirm?: {
    nombre_firma: string;
    rnc?: string | null;
    abogado_principal?: string | null;
    matricula_card?: string | null;
    direccion?: string | null;
    telefono?: string | null;
    email?: string | null;
    ciudad?: string | null;
    provincia?: string | null;
    eslogan?: string | null;
    sitio_web?: string | null;
    logo_url?: string | null;
  } | null;
}

export function InvoiceViewer({ open, onClose, invoice, lawFirm }: InvoiceViewerProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-DO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDownloadExcel = () => {
    // Crear datos para Excel
    const excelData = [
      // Cabecera de la firma
      [lawFirm?.nombre_firma || "Bufete Legal"],
      [lawFirm?.eslogan || ""],
      [`RNC: ${lawFirm?.rnc || "N/A"}`],
      [`Dirección: ${lawFirm?.direccion || "N/A"}`],
      [`Teléfono: ${lawFirm?.telefono || "N/A"}`],
      [`Email: ${lawFirm?.email || "N/A"}`],
      [""],
      [""],
      // Información de la factura
      ["FACTURA"],
      [`Número: ${invoice.numero_factura}`],
      [`Fecha: ${formatDate(invoice.fecha)}`],
      [`Estado: ${invoice.estado.toUpperCase()}`],
      [""],
      [""],
      // Información del cliente
      ["FACTURAR A:"],
      [invoice.clients?.nombre_completo || "Cliente no disponible"],
      [`Cédula/RNC: ${invoice.clients?.cedula_rnc || "N/A"}`],
      [`Email: ${invoice.clients?.email || "N/A"}`],
      [`Teléfono: ${invoice.clients?.telefono || "N/A"}`],
      [`Dirección: ${invoice.clients?.direccion || "N/A"}`],
      [""],
      [""],
      // Detalle de servicios
      ["DETALLE DE SERVICIOS"],
      ["Concepto", "Monto"],
      [invoice.concepto, formatCurrency(invoice.monto)],
      [""],
      [""],
      // Totales
      ["SUBTOTAL", formatCurrency(invoice.monto)],
      ["ITBIS (18%)", formatCurrency(invoice.monto * 0.18)],
      ["TOTAL", formatCurrency(invoice.monto * 1.18)],
      [""],
      [""],
      // Pie de página
      ["TÉRMINOS Y CONDICIONES"],
      ["- Pago contra entrega de factura"],
      ["- Plazo de pago: 30 días desde la fecha de emisión"],
      ["- Intereses moratorios: 1.5% mensual"],
      [""],
      ["Gracias por su confianza"],
      [lawFirm?.nombre_firma || ""],
    ];

    // Crear libro de Excel
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 30 },
      { wch: 20 }
    ];

    // Aplicar estilos a las celdas principales (simulado con formato de texto)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Factura");

    // Descargar archivo
    XLSX.writeFile(wb, `Factura_${invoice.numero_factura}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Factura {invoice.numero_factura}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vista previa de la factura */}
          <Card className="bg-white text-foreground print:shadow-none" id="invoice-content">
            <CardContent className="p-8 space-y-8">
              {/* Encabezado de la firma */}
              <div className="border-b pb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-primary mb-2">
                      {lawFirm?.nombre_firma || "Bufete Legal"}
                    </h2>
                    {lawFirm?.eslogan && (
                      <p className="text-sm text-muted-foreground italic">
                        {lawFirm.eslogan}
                      </p>
                    )}
                  </div>
                  {lawFirm?.logo_url && (
                    <div className="ml-4">
                      <img 
                        src={lawFirm.logo_url} 
                        alt={lawFirm.nombre_firma}
                        className="h-20 w-auto object-contain"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    {lawFirm?.rnc && <p><strong>RNC:</strong> {lawFirm.rnc}</p>}
                    {lawFirm?.abogado_principal && <p><strong>Abogado Principal:</strong> {lawFirm.abogado_principal}</p>}
                    {lawFirm?.matricula_card && <p><strong>Matrícula:</strong> {lawFirm.matricula_card}</p>}
                    {lawFirm?.direccion && <p><strong>Dirección:</strong> {lawFirm.direccion}</p>}
                    {lawFirm?.ciudad && lawFirm?.provincia && (
                      <p>{lawFirm.ciudad}, {lawFirm.provincia}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {lawFirm?.telefono && <p><strong>Tel:</strong> {lawFirm.telefono}</p>}
                    {lawFirm?.email && <p><strong>Email:</strong> {lawFirm.email}</p>}
                    {lawFirm?.sitio_web && <p><strong>Web:</strong> {lawFirm.sitio_web}</p>}
                  </div>
                </div>
              </div>

              {/* Información de la factura */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">FACTURAR A:</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-base">
                      {invoice.clients?.nombre_completo || "Cliente no disponible"}
                    </p>
                    {invoice.clients?.cedula_rnc && (
                      <p><strong>Cédula/RNC:</strong> {invoice.clients.cedula_rnc}</p>
                    )}
                    {invoice.clients?.email && (
                      <p><strong>Email:</strong> {invoice.clients.email}</p>
                    )}
                    {invoice.clients?.telefono && (
                      <p><strong>Teléfono:</strong> {invoice.clients.telefono}</p>
                    )}
                    {invoice.clients?.direccion && (
                      <p><strong>Dirección:</strong> {invoice.clients.direccion}</p>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <h3 className="text-2xl font-bold text-primary">FACTURA</h3>
                  <p className="text-sm"><strong>Número:</strong> {invoice.numero_factura}</p>
                  <p className="text-sm"><strong>Fecha:</strong> {formatDate(invoice.fecha)}</p>
                  <p className="text-sm">
                    <strong>Estado:</strong>{" "}
                    <span className={`font-semibold ${
                      invoice.estado === "pagado" ? "text-green-600" :
                      invoice.estado === "vencido" ? "text-red-600" :
                      "text-amber-600"
                    }`}>
                      {invoice.estado.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Detalle de servicios */}
              <div>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">DETALLE DE SERVICIOS</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-start py-3 border-b">
                    <div className="flex-1">
                      <p className="font-medium">Concepto</p>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {invoice.concepto}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(invoice.monto)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Totales */}
              <div className="border-t pt-6">
                <div className="space-y-2 max-w-xs ml-auto">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.monto)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>ITBIS (18%):</span>
                    <span className="font-medium">{formatCurrency(invoice.monto * 0.18)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>TOTAL:</span>
                    <span className="text-primary">{formatCurrency(invoice.monto * 1.18)}</span>
                  </div>
                </div>
              </div>

              {/* Términos */}
              <div className="border-t pt-6 text-xs text-muted-foreground">
                <h4 className="font-semibold text-foreground mb-2">TÉRMINOS Y CONDICIONES</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Pago contra entrega de factura</li>
                  <li>Plazo de pago: 30 días desde la fecha de emisión</li>
                  <li>Intereses moratorios: 1.5% mensual sobre saldo vencido</li>
                </ul>
              </div>

              {/* Pie de página */}
              <div className="text-center text-sm text-muted-foreground border-t pt-6">
                <p className="font-medium">Gracias por su confianza</p>
                <p className="mt-2">{lawFirm?.nombre_firma || ""}</p>
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={handleDownloadExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Descargar Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
