import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * 主题提供者组件 - 采用字节跳动 Arco Design 风格实现
 * 使用 arco-theme 属性标记深色模式，追求即时响应无过渡
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'moonlight-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const applyTheme = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement;
    const body = window.document.body;

    if (newTheme === 'dark') {
      body.setAttribute('arco-theme', 'dark');
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      body.removeAttribute('arco-theme');
      root.classList.remove('dark');
    } else {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      if (systemTheme === 'dark') {
        body.setAttribute('arco-theme', 'dark');
        root.classList.add('dark');
      } else {
        body.removeAttribute('arco-theme');
        root.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  }, [storageKey]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
