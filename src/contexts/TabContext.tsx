import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconifyIcon } from '@iconify/react';
import { tools } from '../tools';

export interface TabItem {
  id: string;
  path: string;
  title: string;
  icon?: string | IconifyIcon;
  isHome?: boolean;
  isSettings?: boolean;
}

interface TabContextType {
  tabs: TabItem[];
  activeTabId: string;
  openTab: (tab: Omit<TabItem, 'id'> & { id?: string }) => void;
  closeTab: (tabId: string) => void;
  activateTab: (tabId: string) => void;
  closeAllTabs: () => void;
  isTabOpen: (pathOrId: string) => boolean;
}

const HOME_TAB: TabItem = {
  id: '/',
  path: '/',
  title: 'Home',
  icon: 'material-symbols:home-outline-rounded',
  isHome: true
};

const TabContext = createContext<TabContextType>({
  tabs: [HOME_TAB],
  activeTabId: '/',
  openTab: () => {},
  closeTab: () => {},
  activateTab: () => {},
  closeAllTabs: () => {},
  isTabOpen: () => false
});

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<TabItem[]>(() => {
    const saved = sessionStorage.getItem('convertinghub_open_tabs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [HOME_TAB];
  });

  const [activeTabId, setActiveTabId] = useState<string>('/');
  const [recentTabHistory, setRecentTabHistory] = useState<string[]>(['/']);
  const location = useLocation();
  const navigate = useNavigate();

  // Save open tabs to session storage
  useEffect(() => {
    sessionStorage.setItem('convertinghub_open_tabs', JSON.stringify(tabs));
  }, [tabs]);

  // Sync route with active tab when location changes
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Check if current path matches any existing open tab
    const existingTab = tabs.find(
      (t) => t.path === currentPath || (currentPath === '/' && t.isHome)
    );

    if (existingTab) {
      setActiveTabId(existingTab.id);
      setRecentTabHistory((prev) => [
        existingTab.id,
        ...prev.filter((id) => id !== existingTab.id)
      ]);
    } else if (currentPath !== '/') {
      // Find matching tool metadata if applicable
      const matchedTool = tools.find((t) => {
        const toolFormatted = t.path.startsWith('/') ? t.path : `/${t.path}`;
        return toolFormatted === currentPath;
      });

      let newTab: TabItem;

      if (currentPath === '/settings') {
        newTab = {
          id: '/settings',
          path: '/settings',
          title: 'Settings',
          icon: 'solar:settings-bold-duotone',
          isSettings: true
        };
      } else if (matchedTool) {
        newTab = {
          id: currentPath,
          path: currentPath,
          title: matchedTool.name,
          icon: matchedTool.icon || 'solar:document-bold-duotone'
        };
      } else {
        const titleStr = currentPath.substring(1).replace(/[-_]/g, ' ');
        newTab = {
          id: currentPath,
          path: currentPath,
          title: titleStr.charAt(0).toUpperCase() + titleStr.slice(1),
          icon: 'solar:document-text-bold-duotone'
        };
      }

      setTabs((prev) => {
        if (prev.some((t) => t.id === newTab.id)) return prev;
        return [...prev, newTab];
      });
      setActiveTabId(newTab.id);
      setRecentTabHistory((prev) => [
        newTab.id,
        ...prev.filter((id) => id !== newTab.id)
      ]);
    }
  }, [location.pathname]);

  const openTab = (tabData: Omit<TabItem, 'id'> & { id?: string }) => {
    const tabId = tabData.id || tabData.path;
    const existingTab = tabs.find((t) => t.id === tabId || t.path === tabData.path);

    if (existingTab) {
      setActiveTabId(existingTab.id);
      navigate(existingTab.path);
    } else {
      const newTab: TabItem = {
        id: tabId,
        path: tabData.path,
        title: tabData.title,
        icon: tabData.icon || 'solar:document-bold-duotone',
        isHome: tabData.path === '/',
        isSettings: tabData.path === '/settings'
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
      navigate(newTab.path);
    }
  };

  const closeTab = (tabId: string) => {
    // Prevent closing home tab
    if (tabId === '/' || tabs.find((t) => t.id === tabId)?.isHome) {
      return;
    }

    const updatedTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(updatedTabs);

    const updatedHistory = recentTabHistory.filter((id) => id !== tabId);
    setRecentTabHistory(updatedHistory);

    if (activeTabId === tabId) {
      // Find most recent remaining active tab in history
      const nextActiveId = updatedHistory.find((id) =>
        updatedTabs.some((t) => t.id === id)
      );

      const targetTab = updatedTabs.find((t) => t.id === nextActiveId) || updatedTabs[0] || HOME_TAB;
      setActiveTabId(targetTab.id);
      navigate(targetTab.path);
    }
  };

  const activateTab = (tabId: string) => {
    const targetTab = tabs.find((t) => t.id === tabId);
    if (targetTab) {
      setActiveTabId(targetTab.id);
      navigate(targetTab.path);
    }
  };

  const closeAllTabs = () => {
    setTabs([HOME_TAB]);
    setActiveTabId('/');
    setRecentTabHistory(['/']);
    navigate('/');
  };

  const isTabOpen = (pathOrId: string) => {
    return tabs.some((t) => t.id === pathOrId || t.path === pathOrId);
  };

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTabId,
        openTab,
        closeTab,
        activateTab,
        closeAllTabs,
        isTabOpen
      }}
    >
      {children}
    </TabContext.Provider>
  );
};

export const useTabs = () => useContext(TabContext);
