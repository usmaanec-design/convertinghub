import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from 'react';
import { libreOfficeEngine, LibreOfficeStatus } from '@utils/libreofficeEngine';

interface LibreOfficeContextType {
  status: LibreOfficeStatus;
  refreshStatus: () => Promise<void>;
  testEngine: () => Promise<{
    success: boolean;
    message: string;
    version?: string;
  }>;
  isChecking: boolean;
}

const defaultStatus: LibreOfficeStatus = {
  installed: false,
  version: null,
  path: null,
  status: 'bridge_down'
};

const LibreOfficeContext = createContext<LibreOfficeContextType>({
  status: defaultStatus,
  refreshStatus: async () => {},
  testEngine: async () => ({ success: false, message: '' }),
  isChecking: true
});

export const LibreOfficeProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [status, setStatus] = useState<LibreOfficeStatus>(defaultStatus);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const isCheckingRef = useRef<boolean>(false);

  const refreshStatus = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsChecking(true);
    try {
      const currentStatus = await libreOfficeEngine.getStatus();
      setStatus(currentStatus);
    } catch (e) {
      setStatus({
        installed: false,
        version: null,
        path: null,
        status: 'bridge_down'
      });
    } finally {
      setIsChecking(false);
      isCheckingRef.current = false;
    }
  }, []);

  const testEngine = useCallback(async () => {
    return await libreOfficeEngine.testEngine();
  }, []);

  // Run status check ONCE on initial app mount - NO POLLING LOOP!
  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <LibreOfficeContext.Provider
      value={{ status, refreshStatus, testEngine, isChecking }}
    >
      {children}
    </LibreOfficeContext.Provider>
  );
};

export const useLibreOffice = () => useContext(LibreOfficeContext);
