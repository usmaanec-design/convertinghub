import { useState, useEffect } from 'react';
import { useMediaQuery } from '@mui/material';

/**
 * Hook to detect whether current viewport is mobile sized (<= 768px).
 */
export function useIsMobile(breakpoint = 768): boolean {
  const mediaQueryIsMobile = useMediaQuery(`(max-width: ${breakpoint}px)`);

  const [isWindowMobile, setIsWindowMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsWindowMobile(window.innerWidth <= breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return mediaQueryIsMobile || isWindowMobile;
}

export default useIsMobile;
