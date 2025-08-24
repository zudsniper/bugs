export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export class KeyboardManager {
  private shortcuts = new Map<string, () => void>();
  private isListening = false;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  start() {
    if (this.isListening || typeof window === 'undefined') return;
    
    this.isListening = true;
    window.addEventListener('keydown', this.handleKeyDown);
  }

  stop() {
    if (!this.isListening || typeof window === 'undefined') return;
    
    this.isListening = false;
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  addShortcut(shortcut: KeyboardShortcut | string[], callback: () => void) {
    const key = Array.isArray(shortcut) 
      ? this.parseShortcutArray(shortcut).join('+')
      : this.serializeShortcut(shortcut);
    
    this.shortcuts.set(key, callback);
  }

  removeShortcut(shortcut: KeyboardShortcut | string[]) {
    const key = Array.isArray(shortcut)
      ? this.parseShortcutArray(shortcut).join('+')
      : this.serializeShortcut(shortcut);
    
    this.shortcuts.delete(key);
  }

  clearShortcuts() {
    this.shortcuts.clear();
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Don't trigger shortcuts when typing in inputs
    if (this.isTypingContext(event.target)) return;

    const key = this.eventToShortcutKey(event);
    const callback = this.shortcuts.get(key);
    
    if (callback) {
      event.preventDefault();
      event.stopPropagation();
      callback();
    }
  }

  private isTypingContext(target: EventTarget | null): boolean {
    if (!target) return false;
    
    const element = target as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.contentEditable === 'true' ||
      element.isContentEditable
    );
  }

  private eventToShortcutKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');
    
    const key = this.normalizeKey(event.key);
    parts.push(key);
    
    return parts.join('+');
  }

  private serializeShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.meta) parts.push('meta');
    
    const key = this.normalizeKey(shortcut.key);
    parts.push(key);
    
    return parts.join('+');
  }

  private parseShortcutArray(shortcut: string[]): string[] {
    return shortcut.map(key => this.normalizeKey(key));
  }

  private normalizeKey(key: string): string {
    // Normalize key names
    const keyMap: Record<string, string> = {
      ' ': 'space',
      'Escape': 'escape',
      'Enter': 'enter',
      'Tab': 'tab',
      'Backspace': 'backspace',
      'Delete': 'delete',
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right'
    };
    
    return keyMap[key] || key.toLowerCase();
  }
}

export const keyboardManager = new KeyboardManager();