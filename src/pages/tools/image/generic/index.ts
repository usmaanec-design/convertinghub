import { tool as splitImage } from './split/meta';
import { tool as resizeImage } from './resize/meta';
import { tool as compressImage } from './compress/meta';
import { tool as cropImage } from './crop/meta';
import { tool as imageToText } from './image-to-text/meta';
import { tool as qrCodeGenerator } from './qr-code/meta';
import { tool as imageEditor } from './editor/meta';
import { tool as watermark } from './watermark/meta';

export const imageGenericTools = [
  imageEditor,
  resizeImage,
  compressImage,
  cropImage,
  imageToText,
  qrCodeGenerator,
  watermark,
  splitImage
];
