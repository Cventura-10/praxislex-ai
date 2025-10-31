import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LegalActBundle, ActFieldSchema } from "@/lib/legalActsBundle";
import { ChevronLeft, ChevronRight, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { ClientSelector } from "./ClientSelector";
import { TribunalSelector } from "./TribunalSelector";
import { useClients } from "@/hooks/useClients";
import { useLawyers } from "@/hooks/useLawyers";
import { useNotarios } from "@/hooks/useNotarios";
import { useAlguaciles } from "@/hooks/useAlguaciles";
import { usePeritos } from "@/hooks/usePeritos";
import { useTasadores } from "@/hooks/useTasadores";
import { Document, Packer, Paragraph, TextRun } from "docx";
import bundleData from "@/data/praxislex_bundle_v1_3_2.json";

interface BundleIntakeFormProps {
  actBundle: LegalActBundle;
}

export function BundleIntakeForm({ actBundle }: BundleIntakeFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string>("");
  const [partesEditMode, setPartesEditMode] = useState<Record<number, boolean>>({});

  const { clients, getClientById } = useClients();
  const { lawyers } = useLawyers();
  const { notarios } = useNotarios();
  const { alguaciles } = useAlguaciles();
  const { peritos } = usePeritos();
  const { tasadores } = useTasadores();

  // Función para normalizar estado civil
  const normalizeEstadoCivil = (estadoCivil: string | undefined): string => {
    if (!estadoCivil) return "";
    const lower = estadoCivil.toLowerCase().trim();
    
    if (lower.includes("solter")) return "Soltero/a";
    if (lower.includes("casad")) return "Casado/a";
    if (lower.includes("union") || lower.includes("libre")) return "Unión libre";
    if (lower.includes("divorciad")) return "Divorciado/a";
    if (lower.includes("viud")) return "Viudo/a";
    
    return estadoCivil; // Retornar original si no coincide
  };

  // Initialize form with defaults
  useEffect(() => {
    const defaults: Record<string, any> = {};
    actBundle.input_schema_json.fields.forEach(field => {
      if (field.default !== undefined) {
        defaults[field.name] = field.default;
      }
    });
    setFormData(prev => ({ ...prev, ...defaults }));
  }, [actBundle]);

  const fields = actBundle.input_schema_json.fields;
  const fieldsPerStep = 5;
  const totalSteps = Math.ceil(fields.length / fieldsPerStep);
  const currentFields = fields.slice(currentStep * fieldsPerStep, (currentStep + 1) * fieldsPerStep);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleListAdd = (fieldName: string) => {
    const currentList = formData[fieldName] || [];
    setFormData(prev => ({ ...prev, [fieldName]: [...currentList, ""] }));
  };

  const handleListChange = (fieldName: string, index: number, value: string) => {
    const currentList = [...(formData[fieldName] || [])];
    currentList[index] = value;
    setFormData(prev => ({ ...prev, [fieldName]: currentList }));
  };

  const handleListRemove = (fieldName: string, index: number) => {
    const currentList = [...(formData[fieldName] || [])];
    currentList.splice(index, 1);
    setFormData(prev => ({ ...prev, [fieldName]: currentList }));
  };

  // Handlers for complex list objects (like partes)
  const handleObjectListAdd = (fieldName: string, defaultObj: any) => {
    const currentList = formData[fieldName] || [];
    setFormData(prev => ({ ...prev, [fieldName]: [...currentList, defaultObj] }));
  };

  const handleObjectListChange = async (fieldName: string, index: number, subfield: string, value: any) => {
    const currentList = [...(formData[fieldName] || [])];
    currentList[index] = { ...currentList[index], [subfield]: value };
    
    // v1.4.4 - Autofill completo: generales + domicilio
    if (subfield === 'persona_id' && value) {
      try {
        const clientData = await getClientById(value);
        if (clientData) {
          currentList[index] = {
            ...currentList[index],
            nacionalidad: clientData.nacionalidad || "",
            estado_civil: normalizeEstadoCivil(clientData.estado_civil),
            profesion: clientData.profesion || clientData.ocupacion || "",
            // Domicilio (v1.4.4)
            provincia_id: clientData.provincia_id || "",
            municipio_id: clientData.municipio_id || "",
            ciudad_id: clientData.ciudad_id || "",
            direccion: clientData.direccion || "",
            autofill_fuente: "personas",
            autofill_ok: true,
            override: false
          };
          
          // Resetear modo edición para esta parte
          setPartesEditMode(prev => ({ ...prev, [index]: false }));
          
          toast.success(`Generales y domicilio autocompletados para ${currentList[index].rol || `parte #${index + 1}`}`);
        } else {
          currentList[index] = {
            ...currentList[index],
            autofill_ok: false
          };
        }
      } catch (error) {
        console.error("Error al autocompletar datos civiles:", error);
        currentList[index] = {
          ...currentList[index],
          autofill_ok: false
        };
      }
    }
    
    // v1.4.4 - Cascada de geo: limpiar dependientes
    if (subfield === 'provincia_id') {
      currentList[index] = {
        ...currentList[index],
        municipio_id: "",
        ciudad_id: ""
      };
    } else if (subfield === 'municipio_id') {
      currentList[index] = {
        ...currentList[index],
        ciudad_id: ""
      };
    }
    
    // Si estamos en modo override, marcarlo
    if (partesEditMode[index] && ['nacionalidad', 'estado_civil', 'profesion', 'direccion'].includes(subfield)) {
      currentList[index] = {
        ...currentList[index],
        override: true
      };
    }
    
    setFormData(prev => ({ ...prev, [fieldName]: currentList }));
  };

  const handleObjectListRemove = (fieldName: string, index: number) => {
    const currentList = [...(formData[fieldName] || [])];
    currentList.splice(index, 1);
    setFormData(prev => ({ ...prev, [fieldName]: currentList }));
  };

  // Geographic data from bundle
  const provincias = useMemo(() => bundleData.global_catalogs.rd.provincias, []);
  const municipios = useMemo(() => bundleData.global_catalogs.rd.municipios, []);
  const ciudades = useMemo(() => bundleData.global_catalogs.rd.ciudades, []);

  // Filter municipios based on selected provincia
  const filteredMunicipios = useMemo(() => {
    const provinciaId = formData.provincia_id;
    if (!provinciaId) return [];
    return municipios.filter(m => m.provincia_id === provinciaId);
  }, [formData.provincia_id, municipios]);

  // Filter ciudades based on selected municipio
  const filteredCiudades = useMemo(() => {
    const municipioId = formData.municipio_id;
    if (!municipioId) return [];
    return ciudades.filter(c => c.municipio_id === municipioId);
  }, [formData.municipio_id, ciudades]);

  // v1.4.4 - Helpers para geo dependientes en partes[]
  const getMunicipiosByProvincia = (provinciaId: string) => {
    if (!provinciaId) return [];
    return municipios.filter(m => m.provincia_id === provinciaId);
  };

  const getCiudadesByMunicipio = (municipioId: string) => {
    if (!municipioId) return [];
    return ciudades.filter(c => c.municipio_id === municipioId);
  };

  const canProceedToNext = () => {
    return currentFields.every(field => {
      if (!field.required) return true;
      const value = formData[field.name];
      if (field.type === 'list') return value && value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleGenerate();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const response = await supabase.functions.invoke("generate-legal-doc", {
        body: {
          actSlug: actBundle.slug,
          formData,
          template: actBundle.plantilla_md,
          materia: actBundle.materia,
          naturaleza: actBundle.naturaleza,
          ejecutor: actBundle.ejecutor,
        }
      });

      if (response.error) throw response.error;
      
      setGeneratedDocument(response.data.content);
      toast.success("Documento generado exitosamente");
    } catch (error: any) {
      console.error("Error generating document:", error);
      toast.error(error.message || "Error al generar el documento");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadWord = async () => {
    try {
      const doc = new Document({
        sections: [{
          children: generatedDocument.split('\n').map(line => 
            new Paragraph({ children: [new TextRun(line)] })
          )
        }]
      });

      const blob = await Packer.toBlob(doc);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${actBundle.slug}-${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Documento descargado");
    } catch (error: any) {
      toast.error("Error al descargar el documento");
    }
  };

  const renderField = (field: ActFieldSchema) => {
    const value = formData[field.name];

    // Handle geographic dropdowns
    if (field.name === 'provincia_id') {
      return (
        <Combobox
          options={provincias.map(p => ({ value: p.id, label: p.nombre }))}
          value={value}
          onValueChange={(val) => {
            handleFieldChange(field.name, val);
            // Reset dependent fields
            handleFieldChange('municipio_id', '');
            handleFieldChange('ciudad_id', '');
          }}
          placeholder="Seleccionar provincia..."
          searchPlaceholder="Buscar provincia..."
        />
      );
    }

    if (field.name === 'municipio_id') {
      return (
        <Combobox
          options={filteredMunicipios.map(m => ({ value: m.id, label: m.nombre }))}
          value={value}
          onValueChange={(val) => {
            handleFieldChange(field.name, val);
            handleFieldChange('ciudad_id', '');
          }}
          placeholder="Seleccionar municipio..."
          searchPlaceholder="Buscar municipio..."
          disabled={!formData.provincia_id}
        />
      );
    }

    if (field.name === 'ciudad_id') {
      return (
        <Combobox
          options={filteredCiudades.map(c => ({ value: c.id, label: c.nombre }))}
          value={value}
          onValueChange={(val) => handleFieldChange(field.name, val)}
          placeholder="Seleccionar ciudad..."
          searchPlaceholder="Buscar ciudad..."
          disabled={!formData.municipio_id}
        />
      );
    }

    switch (field.type) {
      case 'party':
        return (
          <ClientSelector
            label={field.label}
            fieldPrefix={field.name.replace(/_id$/, '')}
            value={value}
            onChange={(val) => handleFieldChange(field.name, val)}
            onFieldUpdate={(fields) => setFormData(prev => ({ ...prev, ...fields }))}
            required={field.required}
          />
        );

      case 'professional':
        const profData = field.subtype === 'abogado' ? lawyers :
                        field.subtype === 'notario' ? notarios :
                        field.subtype === 'alguacil' ? alguaciles :
                        field.subtype === 'perito' ? peritos :
                        field.subtype === 'tasador' ? tasadores : [];
        
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${field.subtype}`} />
            </SelectTrigger>
            <SelectContent>
              {profData.map((prof: any) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.nombre} {prof.matricula ? `(${prof.matricula})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'select':
        if (field.name === 'tribunal') {
          return <TribunalSelector value={value} onChange={(val) => handleFieldChange(field.name, val)} required={field.required} />;
        }
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            rows={4}
            placeholder={field.label}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label>{field.label}</Label>
          </div>
        );

      case 'list':
        // Check if this is a complex object list (like partes)
        if (field.name === 'partes' || (field as any).item_type === 'object') {
          const partesSchema = bundleData.global_schema_overrides.partes_field;
          const partesList = value || [];
          
          return (
            <div className="space-y-4">
              {partesList.map((parte: any, idx: number) => (
                <Card key={idx} className="border-2">
                   <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">Parte #{idx + 1}</CardTitle>
                        {parte.autofill_ok && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              ✓ Autocompletado
                            </span>
                            <Switch
                              checked={partesEditMode[idx] || false}
                              onCheckedChange={(checked) => {
                                setPartesEditMode(prev => ({ ...prev, [idx]: checked }));
                                if (!checked) {
                                  // Resetear override flag si se desactiva edición
                                  const currentList = [...(formData[field.name] || [])];
                                  currentList[idx] = { ...currentList[idx], override: false };
                                  setFormData(prev => ({ ...prev, [field.name]: currentList }));
                                }
                              }}
                            />
                            <Label className="text-xs cursor-pointer">Editar</Label>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleObjectListRemove(field.name, idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                   <CardContent className="space-y-3">
                    {/* v1.4.4 - Hint solo si NO hay autofill */}
                    {!parte.autofill_ok && (
                      <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
                        💡 Seleccione una persona por cédula/RNC para autocompletar generales y domicilio automáticamente
                      </p>
                    )}
                    
                    {partesSchema.schema.fields.map((subfield: any) => {
                      // Check if field should be shown
                      if (subfield.show_if) {
                        const shouldShow = subfield.show_if.rol_in?.includes(parte.rol);
                        if (!shouldShow) return null;
                      }

                      // v1.4.4 - Campos autofill: generales + domicilio
                      const isAutofilledField = ['nacionalidad', 'estado_civil', 'profesion', 'direccion', 'provincia_id', 'municipio_id', 'ciudad_id'].includes(subfield.name);
                      const isReadonly = parte.autofill_ok && isAutofilledField && !partesEditMode[idx];
                      
                      return (
                        <div key={subfield.name} className="space-y-2">
                          <Label>
                            {subfield.label}
                            {subfield.required && <span className="text-destructive ml-1">*</span>}
                            {isReadonly && <span className="text-xs text-green-600 ml-2">✓ autocompletado</span>}
                          </Label>
                          {renderSubfield(subfield, field.name, idx, parte, isReadonly)}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleObjectListAdd(field.name, { rol: '', persona_id: '' })}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Parte
              </Button>
            </div>
          );
        }

        // Simple list (strings)
        const list = value || [];
        return (
          <div className="space-y-2">
            {list.map((item: string, idx: number) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => handleListChange(field.name, idx, e.target.value)}
                  placeholder={`${field.label} #${idx + 1}`}
                />
                <Button variant="ghost" size="sm" onClick={() => handleListRemove(field.name, idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => handleListAdd(field.name)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar {field.label}
            </Button>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case 'currency':
      case 'number':
      case 'integer':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
          />
        );
    }
  };

  const renderSubfield = (subfield: any, parentFieldName: string, parentIndex: number, parte: any, isReadonly: boolean = false) => {
    const value = parte[subfield.name];
    
    switch (subfield.type) {
      case 'party':
        return (
          <ClientSelector
            label=""
            fieldPrefix={`${parentFieldName}_${parentIndex}_${subfield.name.replace(/_id$/, '')}`}
            value={value}
            onChange={(val) => handleObjectListChange(parentFieldName, parentIndex, subfield.name, val)}
            onFieldUpdate={() => {}} // El autofill lo maneja handleObjectListChange directamente
            required={subfield.required}
          />
        );

      case 'professional':
        const profData = subfield.subtype === 'abogado' ? lawyers :
                        subfield.subtype === 'notario' ? notarios :
                        subfield.subtype === 'alguacil' ? alguaciles :
                        subfield.subtype === 'perito' ? peritos :
                        subfield.subtype === 'tasador' ? tasadores : [];
        
        return (
          <Select 
            value={value} 
            onValueChange={(val) => handleObjectListChange(parentFieldName, parentIndex, subfield.name, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${subfield.subtype}`} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {profData.map((prof: any) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.nombre} {prof.matricula ? `(${prof.matricula})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'select':
        // v1.4.4 - Geo en partes[] - Provincia
        if (subfield.name === 'provincia_id' && subfield.source === 'catalog:rd.provincias') {
          return (
            <Combobox
              options={provincias.map(p => ({ value: p.id, label: p.nombre }))}
              value={value || ""}
              onValueChange={(val) => handleObjectListChange(parentFieldName, parentIndex, subfield.name, val)}
              placeholder="Seleccionar provincia..."
              disabled={isReadonly}
            />
          );
        }
        
        // v1.4.4 - Geo en partes[] - Municipio
        if (subfield.name === 'municipio_id' && subfield.source === 'catalog:rd.municipios') {
          const selectedProvincia = parte.provincia_id;
          const municipiosList = getMunicipiosByProvincia(selectedProvincia);
          
          return (
            <div className="space-y-1">
              <Combobox
                options={municipiosList.map(m => ({ value: m.id, label: m.nombre }))}
                value={value || ""}
                onValueChange={(val) => handleObjectListChange(parentFieldName, parentIndex, subfield.name, val)}
                placeholder={selectedProvincia ? "Seleccionar municipio..." : "Primero seleccione provincia"}
                disabled={!selectedProvincia || isReadonly}
              />
              {!selectedProvincia && (
                <p className="text-xs text-amber-600">Debe seleccionar una provincia primero</p>
              )}
            </div>
          );
        }
        
        // v1.4.4 - Geo en partes[] - Ciudad
        if (subfield.name === 'ciudad_id' && subfield.source === 'catalog:rd.ciudades') {
          const selectedMunicipio = parte.municipio_id;
          const ciudadesList = getCiudadesByMunicipio(selectedMunicipio);
          
          return (
            <div className="space-y-1">
              <Combobox
                options={ciudadesList.map(c => ({ value: c.id, label: c.nombre }))}
                value={value || ""}
                onValueChange={(val) => handleObjectListChange(parentFieldName, parentIndex, subfield.name, val)}
                placeholder={selectedMunicipio ? "Seleccionar ciudad..." : "Primero seleccione municipio"}
                disabled={!selectedMunicipio || isReadonly}
              />
              {!selectedMunicipio && (
                <p className="text-xs text-amber-600">Debe seleccionar un municipio primero</p>
              )}
            </div>
          );
        }
        
        // Otros selects
        return (
          <Select 
            value={value} 
            onValueChange={(val) => handleObjectListChange(parentFieldName, parentIndex, subfield.name, val)}
            disabled={isReadonly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {subfield.options?.map((opt: string) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleObjectListChange(parentFieldName, parentIndex, subfield.name, e.target.value)}
            placeholder={subfield.label}
            disabled={isReadonly}
            className={isReadonly ? "bg-muted cursor-not-allowed" : ""}
            rows={3}
          />
        );

      case 'text':
      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleObjectListChange(parentFieldName, parentIndex, subfield.name, e.target.value)}
            placeholder={isReadonly ? "" : subfield.label}
            disabled={isReadonly}
            className={isReadonly ? "bg-muted cursor-not-allowed" : ""}
          />
        );
    }
  };

  if (generatedDocument) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setGeneratedDocument("")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver a editar
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleDownloadWord}>
              <FileText className="mr-2 h-4 w-4" />
              Descargar Word
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="prose prose-sm max-w-none p-6">
            <pre className="whitespace-pre-wrap font-serif">{generatedDocument}</pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{actBundle.title || actBundle.slug}</h2>
        <div className="text-sm text-muted-foreground">
          Paso {currentStep + 1} de {totalSteps}
        </div>
      </div>

      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {actBundle.materia} • {actBundle.naturaleza} • {actBundle.ejecutor}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceedToNext() || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : currentStep === totalSteps - 1 ? (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generar Documento
            </>
          ) : (
            <>
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
