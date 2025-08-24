import { Theme } from '../types';

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#f97316', // orange-500
    secondary: '#ea580c', // orange-600
    background: '#ffffff',
    foreground: '#0f172a', // slate-900
    muted: '#f1f5f9', // slate-100
    border: '#e2e8f0', // slate-200
    error: '#dc2626', // red-600
    success: '#16a34a', // green-600
    warning: '#ca8a04' // yellow-600
  },
  borderRadius: '0.5rem',
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
  }
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#f97316', // orange-500
    secondary: '#ea580c', // orange-600
    background: '#0f172a', // slate-900
    foreground: '#f8fafc', // slate-50
    muted: '#1e293b', // slate-800
    border: '#334155', // slate-700
    error: '#dc2626', // red-600
    success: '#16a34a', // green-600
    warning: '#ca8a04' // yellow-600
  },
  borderRadius: '0.5rem',
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)'
  }
};

export class ThemeManager {
  private currentTheme: Theme = lightTheme;
  private prefersDark = false;
  private listeners: ((theme: Theme) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          this.prefersDark = e.matches;
          if (this.currentTheme.name === 'auto') {
            this.notifyListeners();
          }
        });
    }
  }

  setTheme(theme: Theme | 'auto') {
    if (theme === 'auto') {
      this.currentTheme = this.prefersDark ? darkTheme : lightTheme;
    } else {
      this.currentTheme = theme;
    }
    
    this.notifyListeners();
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  getCurrentThemeName(): 'light' | 'dark' {
    return this.currentTheme.name === 'auto' 
      ? (this.prefersDark ? 'dark' : 'light')
      : this.currentTheme.name;
  }

  subscribe(listener: (theme: Theme) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentTheme));
  }

  createCustomTheme(name: 'light' | 'dark', overrides: Partial<Theme>): Theme {
    const baseTheme = name === 'dark' ? darkTheme : lightTheme;
    
    return {
      ...baseTheme,
      ...overrides,
      colors: {
        ...baseTheme.colors,
        ...overrides.colors
      },
      shadows: {
        ...baseTheme.shadows,
        ...overrides.shadows
      }
    };
  }

  generateCSSVariables(theme?: Theme): string {
    const t = theme || this.currentTheme;
    
    return `
      --br-color-primary: ${t.colors.primary};
      --br-color-secondary: ${t.colors.secondary};
      --br-color-background: ${t.colors.background};
      --br-color-foreground: ${t.colors.foreground};
      --br-color-muted: ${t.colors.muted};
      --br-color-border: ${t.colors.border};
      --br-color-error: ${t.colors.error};
      --br-color-success: ${t.colors.success};
      --br-color-warning: ${t.colors.warning};
      --br-border-radius: ${t.borderRadius};
      --br-shadow-sm: ${t.shadows.sm};
      --br-shadow-md: ${t.shadows.md};
      --br-shadow-lg: ${t.shadows.lg};
    `;
  }

  injectCSS() {
    if (typeof document === 'undefined') return;

    const existingStyle = document.getElementById('bug-reporter-theme');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'bug-reporter-theme';
    style.textContent = `
      :root {
        ${this.generateCSSVariables()}
      }
      
      .br-bug-reporter {
        ${this.generateCSSVariables()}
      }
    `;

    document.head.appendChild(style);
  }
}

export const themeManager = new ThemeManager();