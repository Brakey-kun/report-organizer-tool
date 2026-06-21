import { pdfjsLib } from './pdfWorkerSetup';
import mammoth from 'mammoth';

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  'fevrier', 'aout'
];

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'ابريل', 'ماي', 'مايو', 'يونيو',
  'يوليوز', 'يوليو', 'غشت', 'أغسطس', 'اغسطس', 'شتنبر', 'سبتمبر', 'أكتوبر', 'اكتوبر', 'نونبر', 'نوفمبر', 'دجنبر', 'ديسمبر'
];

// Map Arabic indic numerals to Latin numerals
function convertArabicNumerals(str: string): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = '';
  for(let i = 0; i < str.length; i++) {
    const idx = arabicNumbers.indexOf(str[i]);
    if(idx !== -1) res += idx;
    else res += str[i];
  }
  return res;
}

export async function extractDateFromFile(file: File): Promise<Date | null> {
  let text = '';
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    text = await extractTextFromPDF(file);
  } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
    text = await file.text();
  } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    text = await extractTextFromDOCX(file);
  }

  return findDateInText(text);
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
    }).promise;
    
    // Check first 3 pages
    const numPages = Math.min(3, pdf.numPages);
    let fullText = '';
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF", error);
    return '';
  }
}

async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX", error);
    return '';
  }
}

export function findDateInText(rawText: string): Date | null {
  // 0. First convert any Arabic numerals to standard Latin numerals to make regex work universally
  const text = convertArabicNumerals(rawText);

  // Normalize text to handle extra spaces and newlines
  const normalizedText = text.replace(/\s+/g, ' ');

  // 1. Try DD/MM/YYYY or DD-MM-YYYY
  const dateRegex1 = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b/;
  const match1 = normalizedText.match(dateRegex1);
  if (match1) {
    const day = parseInt(match1[1]);
    const month = parseInt(match1[2]);
    const year = parseInt(match1[3]);
    if (day <= 31 && month <= 12) {
      return new Date(year, month - 1, day);
    }
  }

  // 2. Try YYYY-MM-DD
  const dateRegex2 = /\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/;
  const match2 = normalizedText.match(dateRegex2);
  if (match2) {
    const year = parseInt(match2[1]);
    const month = parseInt(match2[2]);
    const day = parseInt(match2[3]);
    if (day <= 31 && month <= 12) {
      return new Date(year, month - 1, day);
    }
  }

  // 3. Try French / Arabic text dates e.g. 25 mai 2026 or 25 مايو 2026
  const allMonths = [...MONTHS_FR, ...MONTHS_AR].join('|');
  // Match format with possible arabic prepositions like في or بـ before date, we just look for digit + month + digit
  const textDateRegex = new RegExp(`(\\d{1,2})\\s*(${allMonths})\\s*(\\d{4})`, 'i');
  
  const textMatch = normalizedText.match(textDateRegex);
  if (textMatch) {
    const day = parseInt(textMatch[1]);
    const monthStr = textMatch[2].toLowerCase();
    const year = parseInt(textMatch[3]);
    
    let monthIndex = MONTHS_FR.findIndex(m => m === monthStr);
    if (monthIndex === -1) {
      if (monthStr === 'fevrier') monthIndex = 1;
      else if (monthStr === 'aout') monthIndex = 7;
    }
    
    if (monthIndex === -1) {
      const arMap: Record<string, number> = {
        'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'ابريل': 3, 'ماي': 4, 'مايو': 4, 'يونيو': 5,
        'يوليوز': 6, 'يوليو': 6, 'غشت': 7, 'أغسطس': 7, 'اغسطس': 7, 'شتنبر': 8, 'سبتمبر': 8,
        'أكتوبر': 9, 'اكتوبر': 9, 'نونبر': 10, 'نوفمبر': 10, 'دجنبر': 11, 'ديسمبر': 11
      };
      monthIndex = arMap[monthStr] ?? -1;
    }

    if (monthIndex !== -1) {
      return new Date(year, monthIndex, day);
    }
  }

  return null;
}
