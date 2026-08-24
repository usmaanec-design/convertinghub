import { libreOfficeEngine, ConversionResult, ConversionOptions } from '@utils/libreofficeEngine';

export async function convertPdfToWord(
  pdfFile: File,
  options?: ConversionOptions
): Promise<ConversionResult> {
  return await libreOfficeEngine.convertDocument(pdfFile, 'docx', options);
}
