import { tool as pdfPdfToPng } from './pdf-to-png/meta';
import { tool as pdfRotatePdf } from './rotate-pdf/meta';
import { meta as splitPdfMeta } from './split-pdf/meta';
import { meta as mergePdf } from './merge-pdf/meta';
import { DefinedTool } from '@tools/defineTool';
import { tool as compressPdfTool } from './compress-pdf/meta';
import { tool as protectPdfTool } from './protect-pdf/meta';
import { meta as pdfToEpub } from './pdf-to-epub/meta';
import { tool as pdfEditor } from './editor/meta';
import { tool as convertToPdf } from './convert-to-pdf/meta';
import { meta as extractImageFromPdf } from './extract-images-from-pdf/meta';
import { tool as pdfToWord } from './pdf-to-word/meta';
import { tool as pdfToPpt } from './pdf-to-ppt/meta';
import { tool as pdfToExcel } from './pdf-to-excel/meta';
import { tool as wordToPdf } from './word-to-pdf/meta';
import { tool as pptToPdf } from './ppt-to-pdf/meta';
import { tool as excelToPdf } from './excel-to-pdf/meta';
import { tool as jpgToPdf } from './jpg-to-pdf/meta';
import { tool as watermarkPdf } from './watermark-pdf/meta';
import { tool as pageNumbers } from './page-numbers/meta';
import { tool as organizePdf } from './organize-pdf/meta';
import { tool as unlockPdf } from './unlock-pdf/meta';
import { tool as signPdf } from './sign-pdf/meta';
import { tool as cropPdf } from './crop-pdf/meta';
import { tool as pdfAiSummarizer } from './pdf-ai-summarizer/meta';
import { tool as translatePdf } from './translate-pdf/meta';

export const pdfTools: DefinedTool[] = [
  pdfEditor,
  pdfToWord,
  pdfToPpt,
  pdfToExcel,
  wordToPdf,
  pptToPdf,
  excelToPdf,
  jpgToPdf,
  pdfPdfToPng,
  watermarkPdf,
  pageNumbers,
  organizePdf,
  unlockPdf,
  signPdf,
  cropPdf,
  pdfAiSummarizer,
  translatePdf,
  splitPdfMeta,
  pdfRotatePdf,
  compressPdfTool,
  protectPdfTool,
  mergePdf,
  pdfToEpub,
  convertToPdf,
  extractImageFromPdf
];
