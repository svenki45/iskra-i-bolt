// мост для оверлея производительности (F3): игра спрашивает у оболочки нагрузку на процессор и память
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ibSys', { metrics: () => ipcRenderer.invoke('ib-metrics'), quit: () => ipcRenderer.invoke('ib-quit'),
  gfxGet: () => ipcRenderer.invoke('ib-gfx-get'), gfxSet: v => ipcRenderer.invoke('ib-gfx-set', v) });   // вертикальная синхронизация (меняется с перезапуском)
