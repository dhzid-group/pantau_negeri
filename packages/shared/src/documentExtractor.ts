import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { sanitizeSensitiveText } from './privacyMasker.js';

const execAsync = promisify(exec);

export interface ExtractedDocumentResult {
  text: string;
  method: 'NATIVE_PDF' | 'OCR' | 'HTML' | 'API';
  pageCount?: number;
  wordCount: number;
}

/**
 * Extracts text from a PDF Buffer or file path.
 * 1. Attempts pdftotext (from poppler-utils on Ubuntu / native).
 * 2. If extracted text length < 80 characters (likely scanned images),
 *    falls back to tesseract-ocr on converted PPM/PNG image slices.
 */
export async function extractTextFromPdf(
  pdfBuffer: Buffer,
  docTitle = 'document'
): Promise<ExtractedDocumentResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pantau-pdf-'));
  const pdfPath = path.join(tmpDir, 'input.pdf');
  const txtPath = path.join(tmpDir, 'output.txt');

  try {
    await fs.writeFile(pdfPath, pdfBuffer);

    // Step 1: Attempt native poppler pdftotext
    try {
      await execAsync(`pdftotext -layout -enc UTF-8 "${pdfPath}" "${txtPath}"`, { timeout: 20000 });
      const rawText = await fs.readFile(txtPath, 'utf-8');
      const sanitized = sanitizeSensitiveText(rawText).trim();

      if (sanitized.length >= 80) {
        return {
          text: sanitized,
          method: 'NATIVE_PDF',
          wordCount: sanitized.split(/\s+/).filter(Boolean).length,
        };
      }
    } catch {
      // Fallback to OCR if pdftotext fails or yields empty result
    }

    // Step 2: Fallback to OCR via pdftoppm + tesseract
    try {
      const imgPrefix = path.join(tmpDir, 'page');
      // Convert first 3 pages to PNG at 150 DPI for light OCR
      await execAsync(`pdftoppm -png -r 150 -f 1 -l 3 "${pdfPath}" "${imgPrefix}"`, { timeout: 30000 });

      const files = await fs.readdir(tmpDir);
      const pngFiles = files.filter((f) => f.startsWith('page') && f.endsWith('.png')).sort();

      let ocrCombinedText = '';
      for (const png of pngFiles) {
        const fullPng = path.join(tmpDir, png);
        const ocrOutPrefix = path.join(tmpDir, `ocr-${png}`);
        await execAsync(`tesseract "${fullPng}" "${ocrOutPrefix}" -l ind+eng --oem 1 --psm 3`, {
          timeout: 25000,
        });
        const pageText = await fs.readFile(`${ocrOutPrefix}.txt`, 'utf-8');
        ocrCombinedText += `\n${pageText}`;
      }

      const sanitized = sanitizeSensitiveText(ocrCombinedText).trim();
      return {
        text: sanitized,
        method: 'OCR',
        wordCount: sanitized.split(/\s+/).filter(Boolean).length,
      };
    } catch (ocrErr) {
      // If OCR CLI not installed or failed, return minimal placeholder
      return {
        text: `Dokumen: ${docTitle} (Ekstraksi teks tidak selesai: dependensi OCR belum tersedia di lingkungan saat ini)`,
        method: 'OCR',
        wordCount: 10,
      };
    }
  } finally {
    // Cleanup temporary directory
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
