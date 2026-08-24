import { libreOfficeEngine, ConversionResult } from '@utils/libreofficeEngine';

export interface PdfToExcelOptions {
  layout: 'single' | 'multiple';
  useOcr?: boolean;
  userId?: string;
  authToken?: string;
}

export async function convertPdfToExcel(
  pdfFile: File,
  options: PdfToExcelOptions = { layout: 'single', useOcr: false }
): Promise<ConversionResult> {
  return await libreOfficeEngine.convertDocument(pdfFile, 'xlsx', {
    sheetMode: options.layout,
    userId: options.userId,
    authToken: options.authToken
  });
}
