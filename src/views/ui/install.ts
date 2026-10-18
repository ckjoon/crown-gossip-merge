// install.ts — PWA 설치 프롬프트(beforeinstallprompt) 보관

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

let deferred: InstallPromptEvent | null = null;

export function captureInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
  });
}

export function installPrompt(): InstallPromptEvent | null {
  const p = deferred;
  deferred = null;
  return p;
}
