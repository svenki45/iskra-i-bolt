// Искра и Болт — настольная оболочка (тест для Steam): своё окно, без браузера
const { app, BrowserWindow, globalShortcut, Menu } = require('electron');
const path = require('path');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
let win;
function create(){
  win = new BrowserWindow({ width:1600, height:900, fullscreen:true, backgroundColor:'#0b1830', title:'Искра и Болт', icon:path.join(__dirname,'icon.png'), autoHideMenuBar:true,
    webPreferences:{ contextIsolation:true, backgroundThrottling:false } });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname,'index.html'));
  win.webContents.on('before-input-event',(e,inp)=>{
    if(inp.type==='keyDown'&&(inp.key==='F11'||(inp.alt&&inp.key==='Enter'))){ win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.webContents.setWindowOpenHandler(({url})=>{ require('electron').shell.openExternal(url); return {action:'deny'}; });
}
app.whenReady().then(create);
app.on('window-all-closed',()=>app.quit());
