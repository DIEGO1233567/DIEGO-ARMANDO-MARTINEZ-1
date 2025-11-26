import { FinancialRow } from '../types';
import Papa from 'papaparse';

// --- LISTA MAESTRA EXACTA DEL HTML ---
// Usamos esta lista para garantizar la detección correcta de las columnas de negocio
const POTENTIAL_BUSINESS_HEADERS = [
    'Liverpool', 'Boutiques', 'Automotriz', 'Suburbia', 'Galerias', 
    'Crédito', 'Seguros', 'Servicios Compartidos', 'Financiera', 'Logistica', 'Logística',
    'Tesoreria', 'Tesorería', 'Inmobiliaria', 'Sfera', 'Arco Norte' 
];

// --- Text Correction Helper ---
const fixEncoding = (str: string): string => {
  if (!str) return '';
  let s = String(str);
  // Corrección de caracteres rotos (Mojibake)
  s = s.replace(/Ã¡/g, "á")
       .replace(/Ã©/g, "é")
       .replace(/Ã­/g, "í")
       .replace(/Ã³/g, "ó")
       .replace(/Ãº/g, "ú")
       .replace(/Ã±/g, "ñ")
       .replace(/ÃÑ/g, "Ñ")
       .replace(/Ã/g, "í")
       .replace(/^\uFEFF/, '') // Byte Order Mark
       .replace(/^"|"$/g, ''); // Comillas extra
  return s.trim();
};

const normalizeKey = (str: string) => {
    if (!str) return '';
    return str.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // Quitar acentos para búsqueda interna
              .replace(/[^a-z0-9]/g, ""); // Solo alfanumérico
};

// Función robusta para limpiar moneda (soporta paréntesis contables)
const cleanCurrency = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  
  let str = String(val).trim();
  
  // Detectar formato negativo contable: (1,234.56)
  const isParensNegative = /^\(.*\)$/.test(str);
  
  // Quitar todo lo que no sea número, punto o guión
  const clean = str.replace(/[^0-9.-]/g, '');
  
  if (!clean || clean === '-') return 0;

  let num = parseFloat(clean);
  if (isNaN(num)) return 0;
  
  if (isParensNegative) num = -Math.abs(num);
  return num;
};

// --- Main Processing Logic ---
export const parseFinancialCSV = (file: File): Promise<{ data: FinancialRow[]; segments: string[]; types: string[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy', 
      encoding: 'ISO-8859-1', // Encoding específico para Excel en español
      delimiter: "", // Auto-detectar delimitador
      transformHeader: (h) => fixEncoding(h), // Limpiar encabezados corruptos
      complete: (results) => {
        const rawData = results.data as Record<string, any>[];
        
        if (!rawData || rawData.length === 0) {
          reject(new Error("El archivo está vacío o no se pudo leer."));
          return;
        }

        const headers = results.meta.fields || Object.keys(rawData[0]);
        
        // 1. DETECCIÓN DE COLUMNAS DE NEGOCIO (Estilo Whitelist del HTML)
        const activeBusinessUnits: string[] = [];
        const normalizedHeaders = headers.map(h => ({
            original: h,
            norm: normalizeKey(h)
        }));

        POTENTIAL_BUSINESS_HEADERS.forEach(potential => {
            const normPot = normalizeKey(potential);
            // Buscar si el header potencial existe en el archivo
            const found = normalizedHeaders.find(h => h.norm === normPot);
            
            if (found) {
                activeBusinessUnits.push(found.original);
            }
        });

        if (activeBusinessUnits.length === 0) {
            console.warn("No se detectaron columnas de negocio estándar. Headers:", headers);
            // Si no encuentra nada, es posible que el CSV tenga un formato muy distinto
        }

        const processedData: FinancialRow[] = [];
        const uniqueTypes = new Set<string>();

        rawData.forEach((row, index) => {
          // Helper para buscar valores insensible a mayúsculas
          const rowKeys = Object.keys(row);
          const getVal = (possibleKeys: string[]) => {
            const normalizedPossible = possibleKeys.map(pk => normalizeKey(pk));
            const foundKey = rowKeys.find(rk => normalizedPossible.includes(normalizeKey(rk)));
            return foundKey ? row[foundKey] : '';
          };

          const concept = fixEncoding(getVal(['asunto', 'descripcion', 'concepto']) || '');
          let type = fixEncoding(getVal(['tipo', 'categoria']) || 'N/A');
          const impactType = fixEncoding(getVal(['impacto', 'impacto bg/er']) || '');
          
          // --- REGLAS DE FILTRADO (Idénticas al HTML) ---
          
          // 1. Validación de Asunto
          if (!concept || concept === '' || concept === 'Sin descripción') return;
          
          const conceptLower = concept.toLowerCase();
          
          // 2. Excluir filas de Totales o Sumas
          if (conceptLower.startsWith('total') || conceptLower.startsWith('suma')) return;
          
          // 3. Excepción para Nota de Crédito
          // Si empieza con 'nota' Y NO tiene 'credito' (protección laxa), PERO
          // en el HTML original la regla era: 
          // if (asuntoLower.startsWith('nota') && !asuntoLower.includes('credito')...) { if total===0 return false }
          // Replicamos la lógica exacta:
          const isCreditNote = conceptLower.startsWith('nota') && !conceptLower.includes('credito') && !conceptLower.includes('crédito');
          
          // Limpieza de Tipos basura
          if (type === 'mmm') type = '-';
          if (type === 'N/A') type = '-';

          // --- LÓGICA DE NEGOCIO (Cálculo de Segmentos) ---
          let rowTotal = 0;
          let maxVal = 0;
          let selectedSegment = 'N/A';
          const details: Record<string, number> = {};

          activeBusinessUnits.forEach(unit => {
            // Usamos cleanCurrency para leer el valor, manejando paréntesis y símbolos
            const val = cleanCurrency(row[unit]);
            details[unit] = val; 
            rowTotal += val;

            // Determinar a qué empresa pertenece la fila (el valor absoluto más alto)
            if (Math.abs(val) > Math.abs(maxVal)) {
              maxVal = val;
              selectedSegment = unit;
            }
          });

          // Fallback: Si no se asignó segmento pero hay dinero -> Liverpool
          if (selectedSegment === 'N/A' && rowTotal !== 0) {
             selectedSegment = 'Liverpool'; 
          }
          
          // 4. Último filtro de basura: Si es tipo '-'/'N/A' y el total es 0, descartar
          // (A menos que sea Nota de Crédito válida)
          if ((type === '-' || type === 'N/A') && rowTotal === 0 && !isCreditNote) return;

          // Buscar columna "Total" explícita o usar la calculada
          const totalKey = rowKeys.find(k => normalizeKey(k) === 'total');
          const finalTotal = totalKey ? cleanCurrency(row[totalKey]) : rowTotal;

          uniqueTypes.add(type);

          processedData.push({
            id: `row-${index}`,
            concept,
            type,
            segment: selectedSegment,
            impactType,
            amount: finalTotal,
            details: details,
            originalRow: row
          });
        });

        if (processedData.length === 0) {
             reject(new Error("No se encontraron registros válidos. Verifica que el archivo CSV tenga las columnas de negocio correctas (Liverpool, Suburbia, etc.)."));
             return;
        }

        resolve({ 
          data: processedData, 
          segments: activeBusinessUnits, 
          types: Array.from(uniqueTypes).sort().filter(t => t !== 'N/A' && t !== '-') 
        });
      },
      error: (err) => reject(err),
    });
  });
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN', 
    maximumFractionDigits: 0,
    minimumFractionDigits: 0 
  }).format(val) + ' MDP';
};

export const formatShortNumber = (val: number) => {
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return String(val);
};