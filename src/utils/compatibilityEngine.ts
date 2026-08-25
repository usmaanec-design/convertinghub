import { SupportedFileType } from './fileStore';

export interface ActionDefinition {
  id: string;
  label: string;
  iconName: string;
  color: string;
  toolPath?: string;
  handlerType: 'navigate_tool' | 'view_file' | 'share' | 'print' | 'delete' | 'multi_select';
  requiresSingleFile?: boolean;
}

export function getCompatibleActions(
  selectedFiles: { id: string; type: SupportedFileType; name: string }[]
): ActionDefinition[] {
  if (!selectedFiles || selectedFiles.length === 0) return [];

  const count = selectedFiles.length;
  const types = new Set(selectedFiles.map((f) => f.type));
  const isSingle = count === 1;
  const allPdfs = selectedFiles.every((f) => f.type === 'pdf');
  const allImages = selectedFiles.every((f) => f.type === 'image');
  const singleType = isSingle ? selectedFiles[0].type : null;

  const actions: ActionDefinition[] = [];

  // Common actions available for single items
  if (isSingle) {
    actions.push({
      id: 'view',
      label: 'Open / View Document',
      iconName: 'Visibility',
      color: '#2563eb',
      handlerType: 'view_file',
      requiresSingleFile: true
    });
  }

  // 1. Single PDF actions
  if (isSingle && singleType === 'pdf') {
    actions.push(
      {
        id: 'edit_pdf',
        label: 'Edit & Annotate PDF',
        iconName: 'EditNote',
        color: '#2563eb',
        toolPath: '/pdf/editor',
        handlerType: 'navigate_tool'
      },
      {
        id: 'pdf_to_word',
        label: 'PDF to Word',
        iconName: 'Description',
        color: '#3b82f6',
        toolPath: '/pdf/pdf-to-word',
        handlerType: 'navigate_tool'
      },
      {
        id: 'pdf_to_excel',
        label: 'PDF to Excel',
        iconName: 'TableChart',
        color: '#10b981',
        toolPath: '/pdf/pdf-to-excel',
        handlerType: 'navigate_tool'
      },
      {
        id: 'pdf_to_ppt',
        label: 'PDF to PowerPoint',
        iconName: 'Slideshow',
        color: '#f97316',
        toolPath: '/pdf/pdf-to-powerpoint',
        handlerType: 'navigate_tool'
      },
      {
        id: 'compress_pdf',
        label: 'Compress PDF',
        iconName: 'Compress',
        color: '#8b5cf6',
        toolPath: '/pdf/compress-pdf',
        handlerType: 'navigate_tool'
      },
      {
        id: 'split_pdf',
        label: 'Split PDF',
        iconName: 'CallSplit',
        color: '#ec4899',
        toolPath: '/pdf/split-pdf',
        handlerType: 'navigate_tool'
      },
      {
        id: 'organize_pdf',
        label: 'Organize / Rotate Pages',
        iconName: 'RotateRight',
        color: '#f59e0b',
        toolPath: '/pdf/organize-pdf',
        handlerType: 'navigate_tool'
      }
    );
  }

  // 2. Multiple PDFs actions
  if (!isSingle && allPdfs) {
    actions.push(
      {
        id: 'merge_pdf',
        label: `Merge ${count} PDFs`,
        iconName: 'Merge',
        color: '#2563eb',
        toolPath: '/pdf/merge-pdf',
        handlerType: 'navigate_tool'
      },
      {
        id: 'compress_pdf',
        label: 'Compress PDFs',
        iconName: 'Compress',
        color: '#8b5cf6',
        toolPath: '/pdf/compress-pdf',
        handlerType: 'navigate_tool'
      }
    );
  }

  // 3. Word file actions
  if (isSingle && singleType === 'docx') {
    actions.push({
      id: 'word_to_pdf',
      label: 'Convert Word to PDF',
      iconName: 'PictureAsPdf',
      color: '#ef4444',
      toolPath: '/pdf/word-to-pdf',
      handlerType: 'navigate_tool'
    });
  }

  // 4. Excel file actions
  if (isSingle && singleType === 'xlsx') {
    actions.push({
      id: 'excel_to_pdf',
      label: 'Convert Excel to PDF',
      iconName: 'PictureAsPdf',
      color: '#ef4444',
      toolPath: '/pdf/excel-to-pdf',
      handlerType: 'navigate_tool'
    });
  }

  // 5. PowerPoint file actions
  if (isSingle && singleType === 'pptx') {
    actions.push({
      id: 'ppt_to_pdf',
      label: 'Convert PPT to PDF',
      iconName: 'PictureAsPdf',
      color: '#ef4444',
      toolPath: '/pdf/powerpoint-to-pdf',
      handlerType: 'navigate_tool'
    });
  }

  // 6. Image actions
  if (allImages) {
    actions.push({
      id: 'image_to_pdf',
      label: isSingle ? 'Convert Image to PDF' : `Convert ${count} Images to PDF`,
      iconName: 'PictureAsPdf',
      color: '#ef4444',
      toolPath: '/pdf/jpg-to-pdf',
      handlerType: 'navigate_tool'
    });
  }

  // 7. Text file actions
  if (isSingle && singleType === 'txt') {
    actions.push({
      id: 'text_to_pdf',
      label: 'Convert Text to PDF',
      iconName: 'PictureAsPdf',
      color: '#ef4444',
      toolPath: '/pdf/convert-to-pdf',
      handlerType: 'navigate_tool'
    });
  }

  // Universal actions: Share & Print
  actions.push(
    {
      id: 'share',
      label: 'Share',
      iconName: 'Share',
      color: '#06b6d4',
      handlerType: 'share'
    },
    {
      id: 'print',
      label: 'Print',
      iconName: 'Print',
      color: '#6366f1',
      handlerType: 'print'
    }
  );

  return actions;
}
