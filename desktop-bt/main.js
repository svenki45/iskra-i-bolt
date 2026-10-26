// Искра и Болт: Испытания — отдельная тестовая сборка (уровни в духе старых аркад): своё окно, без браузера
const { app, BrowserWindow, globalShortcut, Menu, ipcMain } = require('electron');
const os = require('os');
const path = require('path');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
let win;
function create(){
  win = new BrowserWindow({ width:1600, height:900, fullscreen:true, backgroundColor:'#0b1830', title:'Искра и Болт — испытания', icon:path.join(__dirname,'icon.png'), autoHideMenuBar:true,
    webPreferences:{ contextIsolation:true, backgroundThrottling:false, preload:path.join(__dirname,'preload.js') } });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname,'index.html'));
  win.webContents.on('before-input-event',(e,inp)=>{
    if(inp.type==='keyDown'&&(inp.key==='F11'||(inp.alt&&inp.key==='Enter'))){ win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.webContents.setWindowOpenHandler(({url})=>{ require('electron').shell.openExternal(url); return {action:'deny'}; });
}
// нагрузка для оверлея F3: процессор игры и всего ПК, память игры и ПК
let lastCpu = null;
function sysCpu(){ let idle=0, total=0; for(const c of os.cpus()){ for(const k in c.times) total+=c.times[k]; idle+=c.times.idle; }
  let pct=null; if(lastCpu){ const dt=total-lastCpu.total, di=idle-lastCpu.idle; if(dt>0) pct=Math.round(100*(1-di/dt)); } lastCpu={total,idle}; return pct; }
ipcMain.handle('ib-quit', () => { app.quit(); });
ipcMain.handle('ib-metrics', () => { const cores=os.cpus().length||1; let cpu=0, ram=0;
  for(const p of app.getAppMetrics()){ cpu+=p.cpu.percentCPUUsage||0; ram+=(p.memory&&p.memory.workingSetSize)||0; }
  return { gameCpu: Math.round(cpu/cores), sysCpu: sysCpu(), gameRamMB: Math.round(ram/1024), sysRamUsedGB: +((os.totalmem()-os.freemem())/1073741824).toFixed(1), sysRamGB: +(os.totalmem()/1073741824).toFixed(1), cores }; });
app.whenReady().then(create);
app.on('window-all-closed',()=>app.quit());
