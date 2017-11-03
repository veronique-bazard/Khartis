/* eslint-env node */
const { app, BrowserWindow, protocol, dialog, ipcMain, Menu } = require('electron');
const { dirname, join, resolve } = require('path');
const isDev = require('electron-is-dev');
const protocolServe = require('electron-protocol-serve');
const fs = require("fs");
const autoUpdater = require('electron-simple-updater');

let mainWindow = null;

// Registering a protocol & schema to serve our Ember application
protocol.registerStandardSchemes(['serve'], { secure: true });
protocolServe({
  cwd: join(__dirname || resolve(dirname('')), '..', 'ember'),
  app,
  protocol,
});

// Uncomment the lines below to enable Electron's crash reporter
// For more information, see http://electron.atom.io/docs/api/crash-reporter/
// electron.crashReporter.start({
//     productName: 'YourName',
//     companyName: 'YourCompany',
//     submitURL: 'https://your-domain.com/url-to-submit',
//     autoSubmit: true
// });
autoUpdater.init({
  url: "https://raw.githubusercontent.com/apezel/khartis-electron-release/master/updates.json",
  checkUpdateOnStart: false,
  autoDownload: false
});
autoUpdater.on('checking-for-update', () => {
  console.log("checking for udpate");
});
autoUpdater.on('update-available', (meta) => {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['Install and Relaunch', 'Later'],
    defaultId: 0,
    message: 'A new version of ' + app.getName() + ' is available. \n',
    detail: "hey"
  }, response => {
    if (response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});
autoUpdater.on('update-downloaded', (meta) => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', () => {

  if (!isDev || true) {
    autoUpdater.checkForUpdates();
  }

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 768,
    'min-width': 1024
  });

  const menuTemplate = [
    {
      label: 'Khartis',
      submenu: [
        {
          label: 'About ...',
          click: () => {
            shell.openExternal("http://www.sciencespo.fr/cartographie/khartis/");
          }
        },
        {
          label: 'Wiki',
          click: () => {
            shell.openExternal("https://github.com/AtelierCartographie/Khartis/wiki");
          }
        },
        {
          label: 'Quit',
          accelerator: 'CommandOrControl+Q',
          click: function() { app.quit(); }
        }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Save',
          click: () => {
            mainWindow.webContents.send('exportProject');
          },
          accelerator: 'CommandOrControl+S',
          enabled: false
        },
        {
          label: 'Open',
          accelerator: 'CommandOrControl+O',
          click: () => {
            dialog.showOpenDialog(mainWindow, {
              properties: ['openFile']
            }, function(files) {
              fs.readFile(files[0], 'utf-8', function (err, data) {
                mainWindow.webContents.send('importProject', data);
              });
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  ipcMain.on("enter-graph-route", function() {
    menu.items[1].submenu.items[0].enabled = true;
  });

  ipcMain.on("exit-graph-route", function() {
    menu.items[1].submenu.items[0].enabled = false;
  });

  delete mainWindow.module;

  // If you want to open up dev tools programmatically, call
  mainWindow.openDevTools();

  const emberAppLocation = 'serve://dist';

  // Load the ember application using our custom protocol/scheme
  mainWindow.loadURL(emberAppLocation);

  // If a loading operation goes wrong, we'll send Electron back to
  // Ember App entry point
  mainWindow.webContents.on('did-fail-load', () => {
    mainWindow.loadURL(emberAppLocation);
  });

  mainWindow.webContents.on('crashed', () => {
    console.log('Your Ember app (or other code) in the main window has crashed.');
    console.log('This is a serious issue that needs to be handled and/or debugged.');
  });

  mainWindow.on('unresponsive', () => {
    console.log('Your Ember app (or other code) has made the window unresponsive.');
  });

  mainWindow.on('responsive', () => {
    console.log('The main window has become responsive again.');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

// Handle an unhandled error in the main thread
//
// Note that 'uncaughtException' is a crude mechanism for exception handling intended to
// be used only as a last resort. The event should not be used as an equivalent to
// "On Error Resume Next". Unhandled exceptions inherently mean that an application is in
// an undefined state. Attempting to resume application code without properly recovering
// from the exception can cause additional unforeseen and unpredictable issues.
//
// Attempting to resume normally after an uncaught exception can be similar to pulling out
// of the power cord when upgrading a computer -- nine out of ten times nothing happens -
// but the 10th time, the system becomes corrupted.
//
// The correct use of 'uncaughtException' is to perform synchronous cleanup of allocated
// resources (e.g. file descriptors, handles, etc) before shutting down the process. It is
// not safe to resume normal operation after 'uncaughtException'.
process.on('uncaughtException', (err) => {
  console.log('An exception in the main thread was not handled.');
  console.log('This is a serious issue that needs to be handled and/or debugged.');
  console.log(`Exception: ${err}`);
});