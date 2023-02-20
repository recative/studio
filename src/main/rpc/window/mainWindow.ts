import type { BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;

export const setMainWindow = (x: BrowserWindow) => {
  mainWindow = x;
};

export const minimizeMainWindow = () => {
  if (!mainWindow) return;
  mainWindow.minimize();
};

export const maximizeMainWindow = () => {
  if (!mainWindow) return;
  mainWindow.maximize();
};

export const unmaximizeMainWindow = () => {
  if (!mainWindow) return;
  mainWindow.unmaximize();
};

export const isMainMaximized = () => {
  if (!mainWindow) return false;
  return mainWindow.isMaximized();
};

export const closeMainWindow = () => {
  if (!mainWindow) return;
  mainWindow.close();
};

export const splashScreenMode = () => {
  if (!mainWindow) return;

  mainWindow.resizable = false;
  mainWindow.setMinimumSize(500, 340);
  mainWindow.setSize(500, 340, false);
  mainWindow.center();
  mainWindow.unmaximize();
  mainWindow.setSkipTaskbar(false);
};

export const studioMode = () => {
  if (!mainWindow) return;

  mainWindow.resizable = true;
  mainWindow.setMinimumSize(800, 600);
  mainWindow.setSize(1024, 728, false);
  mainWindow.maximize();
  mainWindow.setSkipTaskbar(false);
};

export const welcomeMode = () => {
  if (!mainWindow) return;

  mainWindow.resizable = true;
  mainWindow.setMinimumSize(800, 600);
  mainWindow.setSize(1024, 728, false);
  mainWindow.center();
  mainWindow.unmaximize();
  mainWindow.setSkipTaskbar(false);
};
