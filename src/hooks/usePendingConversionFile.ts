import { useEffect } from 'react';

/**
 * Custom hook to pick up any pending conversion file selected from Home/Mobile tab
 * and set it into the tool component's state automatically upon navigation.
 */
export function usePendingConversionFile(
  file: File | File[] | null,
  setFile: (file: any) => void
) {
  useEffect(() => {
    if (
      (!file || (Array.isArray(file) && file.length === 0)) &&
      typeof window !== 'undefined' &&
      (window as any).__pendingConversionFile
    ) {
      const pending = (window as any).__pendingConversionFile;
      if (pending) {
        setFile(pending);
        (window as any).__pendingConversionFile = undefined;
      }
    }
  }, [file, setFile]);
}

export default usePendingConversionFile;
