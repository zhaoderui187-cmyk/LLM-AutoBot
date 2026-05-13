export {};

declare global {
  interface Window {
    electronAPI?: {
      runScript: (scriptPath: string, config: any) => void;
      stopScript: () => void;
      onScriptLog: (callback: (data: string) => void) => () => void;
      onScriptStatus: (callback: (status: string) => void) => () => void;
    };
  }
}
