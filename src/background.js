'use strict'

import {app, protocol, BrowserWindow, globalShortcut, Menu, Tray} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS3_DEVTOOLS} from 'electron-devtools-installer'
import path from 'path'

require('@electron/remote/main').initialize()

const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    {scheme: 'app', privileges: {secure: true, standard: true}}
])


//用一个 Tray 来表示一个图标,这个图标处于正在运行的系统的通知区 ，通常被添加到一个 context menu 上.
//托盘对象
let tray = null;

let indexWindow

async function createIndexWindow() {
    // Create the browser window.
    indexWindow = new BrowserWindow({
        width: 1100,
        height: 650,
        // autoHideMenuBar: true,
        webPreferences: {
            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
            contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
            webSecurity: false
        }
    })

    // 关闭默认菜单
    indexWindow.setMenu(null);

    // 窗口关闭的监听
    indexWindow.on('closed', (event) => {
        console.log(event)
        indexWindow = null;
    });
    // 触发关闭时触发
    indexWindow.on('close', (event) => {
        // 截获 close 默认行为
        event.preventDefault();
        // 点击关闭时触发close事件，我们按照之前的思路在关闭时，隐藏窗口，隐藏任务栏窗口
        indexWindow.hide();
        indexWindow.setSkipTaskbar(true);

    });
    // 触发显示时触发
    indexWindow.on('show', () => {
    });
    // 触发隐藏时触发
    indexWindow.on('hide', () => {
    });
    tray = new Tray(path.resolve('icon.png'));
    // 新建托盘
    // 托盘名称
    tray.setToolTip(app.getName());
    // 托盘菜单
    const contextMenu = Menu.buildFromTemplate([{
        label: '显示',
        click: () => {
            indexWindow.show()
        }
    },
        {
            label: '退出',
            click: () => {
                indexWindow.destroy()
            }
        }
    ]);
    // 载入托盘菜单
    tray.setContextMenu(contextMenu);
    // 双击触发
    tray.on('double-click', () => {
        console.log(indexWindow.isVisible())
        // 双击通知区图标实现应用的显示或隐藏
        indexWindow.isVisible() && !indexWindow.isMinimized() ? indexWindow.hide() : indexWindow.show()
        indexWindow.isVisible() && !indexWindow.isMinimized() ? indexWindow.setSkipTaskbar(false) : indexWindow.setSkipTaskbar(true);
    });

    require('@electron/remote/main').enable(indexWindow.webContents)
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await indexWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) indexWindow.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        await indexWindow.loadURL('app://./index.html')
    }

}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createIndexWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS3_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }
    globalShortcut.register('Ctrl+Alt+D', function () {
        indexWindow.isVisible() ? indexWindow.hide() : indexWindow.show()
    })
    globalShortcut.register('Alt+S', function () {
        //不在任务栏显示
        searchWin.setSkipTaskbar(true)
        searchWin.isVisible() ? searchWin.hide() : searchWin.show()
    })
    createIndexWindow()
    createSearchWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}
let searchWin

async function createSearchWindow() {
    // Create the browser window.
    searchWin = new BrowserWindow({
        width: 600,
        height: 500,
        frame: false,
        show: false,
        resizable: false,
        parent: indexWindow,
        webPreferences: {
            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
            contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
            webSecurity: false
        }
    })
    require('@electron/remote/main').enable(searchWin.webContents)
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await searchWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#searchApp')
        // Load the index.html when not in development
        if (!process.env.IS_TEST) searchWin.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        await searchWin.loadURL('app://./index.html#searchApp')
    }

}