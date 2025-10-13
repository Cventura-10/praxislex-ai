import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, FileText, Filter, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/accountingHelpers';
import * as XLSX from 'xlsx';

interface ReportBuilderProps {
  analyticsData: any;
}

export const ReportBuilder = ({ analyticsData }: ReportBuilderProps) => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<'financial' | 'cases' | 'clients' | 'custom'>('financial');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: undefined,
    to: undefined,
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'revenue',
    'expenses',
    'cases',
    'clients',
  ]);

  const metrics = [
    { id: 'revenue', label: 'Ingresos', category: 'financial' },
    { id: 'expenses', label: 'Gastos', category: 'financial' },
    { id: 'profit', label: 'Utilidad', category: 'financial' },
    { id: 'cases', label: 'Casos', category: 'cases' },
    { id: 'clients', label: 'Clientes', category: 'clients' },
    { id: 'hearings', label: 'Audiencias', category: 'cases' },
    { id: 'documents', label: 'Documentos', category: 'productivity' },
    { id: 'invoices', label: 'Facturas', category: 'financial' },
  ];

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(m => m !== metricId)
        : [...prev, metricId]
    );
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Financial Sheet
    if (selectedMetrics.some(m => ['revenue', 'expenses', 'profit', 'invoices'].includes(m))) {
      const financialData = [
        ['REPORTE FINANCIERO'],
        [''],
        ['Métrica', 'Valor'],
        ['Ingresos Totales', analyticsData?.financial?.totalRevenue || 0],
        ['Gastos Totales', analyticsData?.financial?.totalExpenses || 0],
        ['Utilidad Neta', analyticsData?.financial?.netProfit || 0],
        ['Margen de Utilidad', `${analyticsData?.financial?.profitMargin || 0}%`],
        [''],
        ['TENDENCIAS MENSUALES'],
        ['Mes', 'Ingresos', 'Gastos'],
        ...(analyticsData?.trends?.revenue?.map((rev: any, idx: number) => [
          rev.month,
          rev.value,
          analyticsData?.trends?.expenses[idx]?.value || 0,
        ]) || []),
      ];

      const wsFinancial = XLSX.utils.aoa_to_sheet(financialData);
      XLSX.utils.book_append_sheet(workbook, wsFinancial, 'Financiero');
    }

    // Cases Sheet
    if (selectedMetrics.some(m => ['cases', 'hearings'].includes(m))) {
      const casesData = [
        ['REPORTE DE CASOS'],
        [''],
        ['Métrica', 'Valor'],
        ['Casos Activos', analyticsData?.cases?.active || 0],
        ['Casos Nuevos', analyticsData?.cases?.new || 0],
        ['Casos Cerrados', analyticsData?.cases?.closed || 0],
        ['Tasa de Éxito', `${analyticsData?.cases?.successRate || 0}%`],
        [''],
        ['POR MATERIA'],
        ['Materia', 'Cantidad'],
        ...(analyticsData?.cases?.byMatter?.map((m: any) => [m.name, m.value]) || []),
      ];

      const wsCases = XLSX.utils.aoa_to_sheet(casesData);
      XLSX.utils.book_append_sheet(workbook, wsCases, 'Casos');
    }

    // Clients Sheet
    if (selectedMetrics.includes('clients')) {
      const clientsData = [
        ['REPORTE DE CLIENTES'],
        [''],
        ['Métrica', 'Valor'],
        ['Clientes Totales', analyticsData?.clients?.total || 0],
        ['Clientes Nuevos', analyticsData?.clients?.new || 0],
        ['Clientes Activos', analyticsData?.clients?.active || 0],
        ['Tasa de Retención', `${analyticsData?.clients?.retentionRate || 0}%`],
      ];

      const wsClients = XLSX.utils.aoa_to_sheet(clientsData);
      XLSX.utils.book_append_sheet(workbook, wsClients, 'Clientes');
    }

    // Export
    XLSX.writeFile(workbook, `reporte-praxislex-${Date.now()}.xlsx`);

    toast({
      title: '✓ Reporte exportado',
      description: 'El reporte se ha descargado en formato Excel',
    });
  };

  const exportToPDF = () => {
    // Simplified text export (real PDF would require library like jsPDF)
    let report = `REPORTE PRAXISLEX\n`;
    report += `Generado: ${new Date().toLocaleDateString()}\n\n`;

    if (selectedMetrics.some(m => ['revenue', 'expenses', 'profit'].includes(m))) {
      report += `=== FINANCIERO ===\n`;
      report += `Ingresos: ${formatCurrency(analyticsData?.financial?.totalRevenue || 0)}\n`;
      report += `Gastos: ${formatCurrency(analyticsData?.financial?.totalExpenses || 0)}\n`;
      report += `Utilidad: ${formatCurrency(analyticsData?.financial?.netProfit || 0)}\n\n`;
    }

    if (selectedMetrics.includes('cases')) {
      report += `=== CASOS ===\n`;
      report += `Activos: ${analyticsData?.cases?.active || 0}\n`;
      report += `Nuevos: ${analyticsData?.cases?.new || 0}\n`;
      report += `Cerrados: ${analyticsData?.cases?.closed || 0}\n\n`;
    }

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-praxislex-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: '✓ Reporte exportado',
      description: 'El reporte se ha descargado correctamente',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Constructor de Reportes Personalizados
        </CardTitle>
        <CardDescription>
          Crea reportes personalizados con las métricas que necesitas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type */}
        <div className="space-y-2">
          <Label>Tipo de Reporte</Label>
          <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">Financiero</SelectItem>
              <SelectItem value="cases">Casos</SelectItem>
              <SelectItem value="clients">Clientes</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Rango de Fechas</Label>
          <DatePickerWithRange
            from={dateRange.from}
            to={dateRange.to}
            onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
          />
        </div>

        <Separator />

        {/* Metrics Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <Label>Métricas a Incluir</Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <div key={metric.id} className="flex items-center space-x-2">
                <Checkbox
                  id={metric.id}
                  checked={selectedMetrics.includes(metric.id)}
                  onCheckedChange={() => toggleMetric(metric.id)}
                />
                <label
                  htmlFor={metric.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {metric.label}
                  <Badge variant="outline" className="ml-2 text-xs">
                    {metric.category}
                  </Badge>
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Export Buttons */}
        <div className="flex gap-3">
          <Button onClick={exportToExcel} className="flex-1">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar a Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="flex-1">
            <FileText className="w-4 h-4 mr-2" />
            Exportar a PDF
          </Button>
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Vista Previa del Reporte</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>• Tipo: {reportType}</p>
            <p>• Métricas seleccionadas: {selectedMetrics.length}</p>
            <p>• Período: {dateRange.from && dateRange.to ? 'Personalizado' : 'Todo el tiempo'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
