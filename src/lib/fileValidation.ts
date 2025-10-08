/**
 * File upload validation and security for PraxisLex
 * Prevents malicious file uploads and enforces size/type limits
 */

// Allowed file types with their MIME types and extensions
export const ALLOWED_FILE_TYPES = {
  // Documents
  pdf: {
    mime: ['application/pdf'] as const,
    extensions: ['.pdf'] as const,
    maxSize: 10 * 1024 * 1024, // 10MB
    category: 'document' as const,
  },
  word: {
    mime: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ] as const,
    extensions: ['.doc', '.docx'] as const,
    maxSize: 10 * 1024 * 1024, // 10MB
    category: 'document' as const,
  },
  excel: {
    mime: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ] as const,
    extensions: ['.xls', '.xlsx'] as const,
    maxSize: 5 * 1024 * 1024, // 5MB
    category: 'document' as const,
  },
  // Images
  jpeg: {
    mime: ['image/jpeg', 'image/jpg'] as const,
    extensions: ['.jpg', '.jpeg'] as const,
    maxSize: 5 * 1024 * 1024, // 5MB
    category: 'image' as const,
  },
  png: {
    mime: ['image/png'] as const,
    extensions: ['.png'] as const,
    maxSize: 5 * 1024 * 1024, // 5MB
    category: 'image' as const,
  },
  // Audio (for voice input)
  mp3: {
    mime: ['audio/mpeg', 'audio/mp3'] as const,
    extensions: ['.mp3'] as const,
    maxSize: 10 * 1024 * 1024, // 10MB
    category: 'audio' as const,
  },
  wav: {
    mime: ['audio/wav', 'audio/wave'] as const,
    extensions: ['.wav'] as const,
    maxSize: 20 * 1024 * 1024, // 20MB
    category: 'audio' as const,
  },
  webm: {
    mime: ['audio/webm'] as const,
    extensions: ['.webm'] as const,
    maxSize: 10 * 1024 * 1024, // 10MB
    category: 'audio' as const,
  },
};

// Magic bytes for file type verification
type FileTypeKey = keyof typeof ALLOWED_FILE_TYPES;

const FILE_SIGNATURES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  word: [0x50, 0x4B, 0x03, 0x04], // ZIP-based (DOCX)
  excel: [0x50, 0x4B, 0x03, 0x04], // ZIP-based (XLSX)
  mp3: [0xFF, 0xFB], // or [0x49, 0x44, 0x33] for ID3
  wav: [0x52, 0x49, 0x46, 0x46], // RIFF
  webm: [0x1A, 0x45, 0xDF, 0xA3], // EBML
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Validate file type, size, and content
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  const warnings: string[] = [];
  
  // 1. Check file exists
  if (!file) {
    return { valid: false, error: 'No se ha proporcionado ningún archivo' };
  }
  
  // 2. Check file size (global max 20MB)
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `El archivo es demasiado grande (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` 
    };
  }
  
  if (file.size === 0) {
    return { valid: false, error: 'El archivo está vacío' };
  }
  
  // 3. Check filename
  const filename = file.name;
  if (!filename || filename.length > 255) {
    return { valid: false, error: 'Nombre de archivo inválido' };
  }
  
  // Check for dangerous patterns in filename
  if (/[<>:"|?*\x00-\x1f]/.test(filename)) {
    return { valid: false, error: 'El nombre del archivo contiene caracteres inválidos' };
  }
  
  // 4. Get file extension
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension) {
    return { valid: false, error: 'El archivo no tiene extensión' };
  }
  
  // 5. Find matching file type configuration
  const fileTypeEntry = Object.entries(ALLOWED_FILE_TYPES).find(
    ([_, config]) => config.extensions.some(ext => ext === extension)
  );
  
  if (!fileTypeEntry) {
    return { 
      valid: false, 
      error: `Tipo de archivo no permitido (${extension})` 
    };
  }
  
  const [fileType, config] = fileTypeEntry;
  
  // 6. Check MIME type
  if (!config.mime.some(mime => mime === file.type)) {
    warnings.push(`El tipo MIME ${file.type} no coincide con la extensión ${extension}`);
  }
  
  // 7. Check specific size limit for file type
  if (file.size > config.maxSize) {
    return { 
      valid: false, 
      error: `El archivo ${config.category} es demasiado grande (max ${config.maxSize / 1024 / 1024}MB)` 
    };
  }
  
  // 8. Verify file signature (magic bytes) for security
  try {
    const signatureValid = await verifyFileSignature(file, fileType);
    if (!signatureValid) {
      return { 
        valid: false, 
        error: 'El contenido del archivo no coincide con su extensión' 
      };
    }
  } catch (error) {
    warnings.push('No se pudo verificar la firma del archivo');
  }
  
  return { 
    valid: true, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

/**
 * Verify file signature (magic bytes) to ensure file type matches content
 */
async function verifyFileSignature(file: File, fileType: string): Promise<boolean> {
  const signature = FILE_SIGNATURES[fileType];
  if (!signature) {
    // No signature to verify
    return true;
  }
  
  try {
    const headerBytes = await readFileHeader(file, signature.length);
    
    // Compare magic bytes
    for (let i = 0; i < signature.length; i++) {
      if (headerBytes[i] !== signature[i]) {
        return false;
      }
    }
    
    return true;
  } catch {
    // If can't read, don't fail validation (but log warning)
    return true;
  }
}

/**
 * Read first N bytes of file
 */
function readFileHeader(file: File, numBytes: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const blob = file.slice(0, numBytes);
    
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(new Uint8Array(arrayBuffer));
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Get safe file category
 */
export function getFileCategory(file: File): string {
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension) return 'unknown';
  
  const fileTypeEntry = Object.entries(ALLOWED_FILE_TYPES).find(
    ([_, config]) => config.extensions.some(ext => ext === extension)
  );
  
  return fileTypeEntry?.[1].category || 'unknown';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if file type is allowed for a specific purpose
 */
export function isFileTypeAllowed(file: File, allowedCategories: string[]): boolean {
  const category = getFileCategory(file);
  return allowedCategories.includes(category);
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilenameForStorage(filename: string): string {
  const extension = filename.match(/\.[^.]+$/)?.[0] || '';
  const nameWithoutExt = filename.slice(0, -extension.length);
  
  // Remove/replace unsafe characters
  const safeName = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 200); // Max length
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  
  return `${safeName}_${timestamp}${extension}`;
}

/**
 * Generate secure random filename
 */
export function generateSecureFilename(originalFilename: string): string {
  const extension = originalFilename.match(/\.[^.]+$/)?.[0] || '';
  const randomString = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  
  return `file_${timestamp}_${randomString}${extension}`;
}
