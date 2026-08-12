import { libreOfficeEngine, ConversionResult } from '@utils/libreofficeEngine';

export async function convertPdfToWord(pdfFile: File): Promise<ConversionResult> {
  return await libreOfficeEngine.convertDocument(pdfFile, 'docx');
}
