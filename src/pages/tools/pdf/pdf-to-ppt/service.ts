import { libreOfficeEngine, ConversionResult } from '@utils/libreofficeEngine';

export async function convertPdfToPpt(pdfFile: File): Promise<ConversionResult> {
  return await libreOfficeEngine.convertDocument(pdfFile, 'pptx');
}
