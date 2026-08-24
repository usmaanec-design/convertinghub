export const DEFAULT_SITE_URL = 'https://convertinghub-official.web.app';

export function getSiteUrl(): string {
  const envUrl = import.meta.env?.VITE_SITE_URL;
  const rawUrl = envUrl || DEFAULT_SITE_URL;
  return rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
}

export interface ToolSeoOverride {
  title?: string;
  description?: string;
  h1?: string;
  intro?: string;
  keywords?: string[];
  howTo?: { step: number; title: string; text: string }[];
  features?: { title: string; text: string }[];
  faqs?: { question: string; answer: string }[];
}

export const TOOL_SEO_OVERRIDES: Record<string, ToolSeoOverride> = {
  'pdf/pdf-to-word': {
    title: 'PDF to Word Converter – Convert PDF to DOCX Online | ConvertingHub',
    description:
      'Convert PDF files to editable Word DOCX documents online for free with ConvertingHub. Fast, secure, and preserves original document formatting.',
    h1: 'PDF to Word Converter',
    intro:
      'Easily transform your PDF files into fully editable Microsoft Word (DOCX) documents online. Our tool extracts text, layouts, images, and formatting to deliver clean Word files ready for editing.',
    keywords: [
      'pdf to word',
      'convert pdf to word',
      'pdf to docx',
      'online pdf converter',
      'edit pdf in word'
    ],
    howTo: [
      {
        step: 1,
        title: 'Upload PDF File',
        text: 'Select or drag & drop your PDF file into the converter area.'
      },
      {
        step: 2,
        title: 'Start Conversion',
        text: 'Click the Convert button to process your document securely.'
      },
      {
        step: 3,
        title: 'Download DOCX',
        text: 'Download your editable Word document immediately after processing.'
      }
    ],
    features: [
      {
        title: 'High Accuracy Text Extraction',
        text: 'Retains original typography, paragraph flow, and tables accurately.'
      },
      {
        title: 'Privacy & File Security',
        text: 'Files are processed securely in your browser or deleted automatically after conversion.'
      },
      {
        title: 'No Installation Required',
        text: 'Works on Windows, Mac, Linux, iOS, and Android straight from your browser.'
      }
    ],
    faqs: [
      {
        question: 'Is the PDF to Word converter free to use?',
        answer:
          'Yes, ConvertingHub provides free PDF to Word conversion online.'
      },
      {
        question: 'Can I convert multi-page PDF documents?',
        answer:
          'Yes, multi-page PDFs are fully supported and converted into a single Word document.'
      },
      {
        question: 'Will the formatting of my PDF be preserved?',
        answer:
          'Our conversion engine preserves fonts, headings, images, and alignment as closely as possible to the source document.'
      }
    ]
  },

  'pdf/pdf-to-excel': {
    title:
      'PDF to Excel Converter – Convert PDF to XLSX Online | ConvertingHub',
    description:
      'Extract data from PDF tables into editable Excel spreadsheets (XLSX) instantly with ConvertingHub. Fast, accurate, and completely online.',
    h1: 'PDF to Excel Converter',
    intro:
      'Convert complex PDF tables and tabular data into clean, editable Microsoft Excel (XLSX) spreadsheets. Perfect for financial reports, invoices, and data analysis.',
    keywords: [
      'pdf to excel',
      'convert pdf to xlsx',
      'pdf table extractor',
      'pdf to spreadsheet'
    ],
    howTo: [
      {
        step: 1,
        title: 'Upload PDF',
        text: 'Choose your PDF document containing tabular data.'
      },
      {
        step: 2,
        title: 'Convert Table Data',
        text: 'The converter detects rows and columns to structure your spreadsheet.'
      },
      {
        step: 3,
        title: 'Download Excel File',
        text: 'Save the generated XLSX file to your device.'
      }
    ],
    features: [
      {
        title: 'Automatic Table Recognition',
        text: 'Intelligently detects data columns, cell borders, and numerical values.'
      },
      {
        title: 'Ready for Analysis',
        text: 'Outputs standard XLSX files compatible with Excel, Google Sheets, and LibreOffice Calc.'
      }
    ],
    faqs: [
      {
        question: 'Can I edit the converted Excel file immediately?',
        answer:
          'Yes, the output is a standard XLSX spreadsheet that can be opened and edited in any spreadsheet application.'
      }
    ]
  },

  'pdf/pdf-to-ppt': {
    title:
      'PDF to PowerPoint Converter – Convert PDF to PPTX Online | ConvertingHub',
    description:
      'Turn PDF documents into editable PowerPoint presentation slides (PPTX) online with ConvertingHub.',
    h1: 'PDF to PowerPoint Converter',
    intro:
      'Convert your PDF documents into dynamic PowerPoint presentation slides (PPTX). Easily modify text, slide layouts, and graphic elements.',
    keywords: [
      'pdf to ppt',
      'pdf to powerpoint',
      'convert pdf to pptx',
      'pdf slides converter'
    ]
  },

  'pdf/word-to-pdf': {
    title: 'Word to PDF Converter – Convert DOCX to PDF Online | ConvertingHub',
    description:
      'Convert Word DOC and DOCX files into professional, read-only PDF documents online with ConvertingHub.',
    h1: 'Word to PDF Converter',
    intro:
      'Convert Microsoft Word files (DOC and DOCX) into standardized PDF documents. Ensure your document formatting remains intact on any device.',
    keywords: [
      'word to pdf',
      'docx to pdf',
      'convert word to pdf',
      'doc to pdf converter'
    ]
  },

  'pdf/excel-to-pdf': {
    title:
      'Excel to PDF Converter – Convert XLSX to PDF Online | ConvertingHub',
    description:
      'Convert Excel XLSX spreadsheets into formatted PDF files online with ConvertingHub. Fast, secure, and reliable.',
    h1: 'Excel to PDF Converter',
    intro:
      'Transform Excel spreadsheets into neat, print-ready PDF files. Fits tables and sheets neatly onto standardized PDF pages.',
    keywords: [
      'excel to pdf',
      'xlsx to pdf',
      'convert excel to pdf',
      'spreadsheet to pdf'
    ]
  },

  'pdf/ppt-to-pdf': {
    title: 'PowerPoint to PDF Converter – Convert PPTX to PDF | ConvertingHub',
    description:
      'Convert PowerPoint PPTX slides into shareable PDF files online with ConvertingHub.',
    h1: 'PowerPoint to PDF Converter',
    intro:
      'Convert PowerPoint presentations into compact PDF files for easy sharing, viewing, and printing.',
    keywords: ['ppt to pdf', 'powerpoint to pdf', 'pptx to pdf']
  },

  'pdf/jpg-to-pdf': {
    title:
      'JPG to PDF Converter – Convert Images to PDF Online | ConvertingHub',
    description:
      'Convert JPG and JPEG images into a single formatted PDF document online with ConvertingHub.',
    h1: 'JPG to PDF Converter',
    intro:
      'Combine one or multiple JPG images into a clean, professional PDF file in seconds.',
    keywords: ['jpg to pdf', 'image to pdf', 'jpeg to pdf converter']
  },

  'pdf/pdf-to-png': {
    title: 'PDF to PNG Converter – Extract PDF Pages as Images | ConvertingHub',
    description:
      'Convert PDF pages into high-resolution PNG images online for free with ConvertingHub.',
    h1: 'PDF to PNG Converter',
    intro:
      'Extract individual pages from your PDF file and convert them into crisp, lossless PNG images.'
  },

  'pdf/merge-pdf': {
    title: 'Merge PDF Files Online – Combine PDFs into One | ConvertingHub',
    description:
      'Merge multiple PDF documents into a single unified file online with ConvertingHub. Quick, easy, and secure.',
    h1: 'Merge PDF Online',
    intro:
      'Combine multiple PDF files into one ordered document. Drag and drop to reorder pages and merge effortlessly.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'pdf binder']
  },

  'pdf/split-pdf': {
    title: 'Split PDF Files Online – Extract PDF Pages | ConvertingHub',
    description:
      'Split PDF documents into separate pages or custom page ranges online with ConvertingHub.',
    h1: 'Split PDF Online',
    intro:
      'Separate pages from a PDF or divide a large document into independent smaller files.'
  },

  'pdf/compress-pdf': {
    title: 'Compress PDF Online – Reduce PDF File Size | ConvertingHub',
    description:
      'Reduce PDF file size while preserving document clarity and visual quality with ConvertingHub.',
    h1: 'Compress PDF Online',
    intro:
      'Optimize and shrink large PDF files to make them easier to email, share, and upload.'
  },

  'converters/audio-converter': {
    title: 'Audio Converter Online – Convert Audio Files | ConvertingHub',
    description:
      'Convert audio files between MP3, WAV, AAC, OGG, and FLAC formats online with ConvertingHub.',
    h1: 'Online Audio Converter'
  }
};

export function getToolSeoData(
  fullPath: string,
  fallbackTitle: string,
  fallbackDescription: string,
  category: string
) {
  const override = TOOL_SEO_OVERRIDES[fullPath] || {};
  const siteUrl = getSiteUrl();

  const title =
    override.title ||
    `${fallbackTitle} – Free Online ${category.toUpperCase()} Tool | ConvertingHub`;

  const description =
    override.description ||
    (fallbackDescription.length > 20
      ? fallbackDescription
      : `Use ${fallbackTitle} online for free with ConvertingHub. Fast, secure, and web-based conversion tool.`);

  const h1 = override.h1 || fallbackTitle;
  const intro =
    override.intro ||
    fallbackDescription ||
    `Easily use ${fallbackTitle} online directly in your web browser with ConvertingHub.`;

  const canonicalUrl = `${siteUrl}/${fullPath}`;

  const defaultHowTo = [
    {
      step: 1,
      title: 'Select Input',
      text: 'Upload or input your files into the workspace.'
    },
    {
      step: 2,
      title: 'Process File',
      text: 'Configure options and initiate processing.'
    },
    {
      step: 3,
      title: 'Download Result',
      text: 'Save the converted output file to your device.'
    }
  ];

  const defaultFeatures = [
    {
      title: 'Browser-Based Convenience',
      text: 'No software download or plugin installation required.'
    },
    {
      title: 'Privacy & Data Protection',
      text: 'Your files are handled securely and never shared with third parties.'
    },
    {
      title: 'Fast & Free Processing',
      text: 'Instant results optimized for desktop and mobile browsers.'
    }
  ];

  const defaultFaqs = [
    {
      question: `Is ${h1} free to use?`,
      answer: `Yes, ${h1} is completely free to use online at ConvertingHub.`
    },
    {
      question: `Do I need an account to use ${h1}?`,
      answer:
        'No registration is required for standard usage. You can start converting immediately.'
    },
    {
      question: 'Are my uploaded files safe?',
      answer:
        'Yes, file safety is prioritized. Files are processed securely and deleted automatically.'
    }
  ];

  return {
    title,
    description,
    h1,
    intro,
    canonicalUrl,
    keywords: override.keywords || [
      h1.toLowerCase(),
      'online converter',
      'convertinghub'
    ],
    howTo: override.howTo || defaultHowTo,
    features: override.features || defaultFeatures,
    faqs: override.faqs || defaultFaqs
  };
}

export function getCategorySeoData(
  categoryName: string,
  categoryTitle: string,
  categoryDescription: string
) {
  const siteUrl = getSiteUrl();
  const formattedCategory = categoryTitle || categoryName;

  return {
    title: `${formattedCategory} – Online Conversion & Editing Tools | ConvertingHub`,
    description:
      categoryDescription ||
      `Explore free online ${formattedCategory} on ConvertingHub. Fast, secure, browser-based tools for productivity.`,
    h1: formattedCategory,
    canonicalUrl: `${siteUrl}/categories/${categoryName}`,
    ogImage: `${siteUrl}/Logos/logo-og.png`
  };
}

export function getHomeSeoData() {
  const siteUrl = getSiteUrl();
  return {
    title: 'ConvertingHub – Free Online Document, PDF & File Converters',
    description:
      'ConvertingHub offers a suite of free online tools for converting, editing, compressing, and managing PDF, Word, Excel, Images, Audio, and code files.',
    canonicalUrl: `${siteUrl}/`,
    ogImage: `${siteUrl}/Logos/logo-og.png`
  };
}
