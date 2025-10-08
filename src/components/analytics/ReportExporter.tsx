import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Table2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface ReportExporterProps {
  data: any;
  filename: string;
  title?: string;
}

/**
 * Component for exporting reports in multiple formats
 * Supports PDF, Excel, and CSV exports
 */
export function ReportExporter({ data, filename, title }: ReportExporterProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = () => {
    setIsExporting(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
      
      // Generate and download
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      toast.success('Reporte exportado', {
        description: 'El archivo Excel se ha descargado correctamente.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar', {
        description: 'No se pudo generar el archivo Excel.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
      
      toast.success('Reporte exportado', {
        description: 'El archivo CSV se ha descargado correctamente.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar', {
        description: 'No se pudo generar el archivo CSV.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    toast.info('Generando PDF', {
      description: 'Esta funcionalidad estará disponible próximamente.',
    });
    
    setIsExporting(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          <Table2 className="mr-2 h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="mr-2 h-4 w-4" />
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="mr-2 h-4 w-4" />
          PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
