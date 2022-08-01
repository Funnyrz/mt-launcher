import {pinyin} from "pinyin-pro";
import {appInfoDb} from "./dbUtil";
import installedPaths from "installed-win-apps";
import {shell} from "electron";

/**
 * 代码参考
 * https://github.com/zhujiaming/uTools-AppUninstaller/blob/master/preload.js
 */

const path = require("path")
const child = require('child_process')
const iconv = require('iconv-lite')
const iconPromise = require('icon-promise')
const write = require('write')

export default {
    async getIconInfo(exePath) {
        if (process.env.NODE_ENV === 'production') {
            iconPromise.overrideExtractorPath(path.join(__dirname, "../app.asar.unpacked/node_modules/icon-promise/bin"), 'IconExtractor.exe')
        }
        const {Base64ImageData} = await iconPromise.getIcon256(exePath)
        const dataBuffer = new Buffer(Base64ImageData, 'base64')
        if (dataBuffer.length / 1000 >= 2.5) {
            return Base64ImageData
        } else {
            const {Base64ImageData} = await iconPromise.getIcon48(exePath)
            return Base64ImageData
        }
    },
    powershell(cmd, callback) {
        const ps = child.spawn('powershell', ['-NoProfile', '-Command', cmd], {encoding: 'buffer'})
        let chunks = [];
        let err_chunks = [];
        ps.stdout.on('data', chunk => {
            chunks.push(iconv.decode(chunk, 'cp936'))
        })
        ps.stderr.on('data', err_chunk => {
            err_chunks.push(iconv.decode(err_chunk, 'cp936'))
        })
        ps.on('close', () => {
            let stdout = chunks.join("");
            let stderr = err_chunks.join("");
            callback(stdout, stderr)
        })
    },

    getAppList(callback) {
        let filterValues = "Select-Object DisplayName,DisplayIcon,UninstallString,DisplayVersion,InstallDate,Publisher,InstallLocation"
        let localMatcine = `Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
        let currentUser = `Get-ItemProperty HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
        let Wow6432Node = `Get-ItemProperty HKLM:\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
        let x64 = process.arch === 'x64' ? `;${Wow6432Node}` : '';
        this.powershell(`${localMatcine};${currentUser}${x64}`, async (stdout) => {
                let appList = [];
                let apps = stdout.trim().replace(/\r\n[ ]{10,}/g, "").split('\r\n\r\n');
                for (var app of apps) {
                    let dict = {}
                    let lines = app.split('\r\n')
                    for (var line of lines) {
                        if (line) {
                            let key = line.split(/\s+:\s*/)[0];
                            let value = line.split(/\s+:\s*/)[1];
                            dict[key] = value;
                        }
                    }

                    // const icon = path.join(os.tmpdir(), 'ProcessIcon', `${encodeURIComponent(dict.LegalName)}.png`);
                    if (this.filterApps(dict)) {
                        dict.LegalName = dict.DisplayName
                        dict.ExePath = dict.DisplayIcon.replace(/(,0|")/g, "")
                        const icon = path.join(require('@electron/remote').app.getPath('userData'), 'icons', `${dict.LegalName}.png`)
                        const Base64ImageData = await this.getIconInfo(dict.ExePath);
                        const dataBuffer = new Buffer(Base64ImageData, 'base64')
                        write.sync(icon, dataBuffer, {overwrite: true})
                        dict.Word = pinyin(dict.LegalName, {pattern: 'first', toneType: 'none'}).replace(/ /g, '')
                        dict.Icon = icon
                        dict.Source = "registry"
                        appList.push(dict);
                    }
                }
                callback(appList);
            }
        )
        ;
    },

    filterApps(dict) {
        if (!dict.DisplayName) {
            return false
        }
        if (dict.DisplayIcon.indexOf('.exe') === -1) {
            return false
        }
        if (dict.Publisher.indexOf('Microsoft Corporation') >= 0) {
            return false
        }
        if (dict.Publisher.indexOf('NVIDIA Corporation') >= 0) {
            return false
        }
        return true

    },

    unInstallApp(command, callback) {
        command = command.replace(/(^[A-z]:\\[\S ]+\\\S+)($| )/, '"$1"$2')
        child.exec(command, {encoding: 'buffer'}, (err, stdout, stderr) => {
            if (err) {
                callback(iconv.decode(stderr, 'cp936'));
            }
        })
    },

    toUnInstallPanel() {
        let command = 'control /name Microsoft.ProgramsAndFeatures'
        command = command.replace(/(^[A-z]:\\[\S ]+\\\S+)($| )/, '"$1"$2')
        child.exec(command, {encoding: 'buffer'}, (err) => {
            if (err) {
                console.log(err)
            }
        })
    },

    getAppData() {
        let appsLnk = Object.keys(appInfoDb.get('appsLnk')).length === 0 ? [] : appInfoDb.get('appsLnk').data
        let appsReg = Object.keys(appInfoDb.get('appsReg')).length === 0 ? [] : appInfoDb.get('appsReg').data
        appsLnk.push(...appsReg)
        return appsLnk
    },
    getMenuAppData() {
        return Object.keys(appInfoDb.get('appsMenu')).length === 0 ? [] : appInfoDb.get('appsMenu').data
    },
    getLnkAppData() {
        return Object.keys(appInfoDb.get('appsLnk')).length === 0 ? [] : appInfoDb.get('appsLnk').data
    },

    getRegAppData() {
        return Object.keys(appInfoDb.get('appsReg')).length === 0 ? [] : appInfoDb.get('appsReg').data
    },
    getStartMenuApps() {
        installedPaths.getAllPaths('', true).then(async (lnkApps) => {
            let appArr = []
            let keys = []
            for (const lnkApp of lnkApps) {
                try {
                    const retLnk = shell.readShortcutLink(lnkApp.lnk)
                    const exePath = retLnk.target;
                    let index = lnkApp.lnk.lastIndexOf('\\');
                    const name = lnkApp.lnk.substring(index + 1, lnkApp.lnk.length - 4)
                    if (name.indexOf('卸载') >= 0 || name.toLowerCase().indexOf('uninstall') >= 0) {
                        continue
                    }
                    if (keys.indexOf(name) >= 0) {
                        continue
                    }
                    if (exePath) {
                        let dict = {}
                        const base64ImageData = await this.getIconInfo(exePath)

                        const icon = path.join(require('@electron/remote').app.getPath('userData'), 'icons', `menu_${name}.png`)
                        const dataBuffer = new Buffer(base64ImageData, 'base64')
                        write.sync(icon, dataBuffer, {overwrite: true})
                        dict.DisplayName = name
                        dict.Lnk = lnkApp.lnk
                        dict.ExePath = exePath
                        dict.Word = pinyin(dict.DisplayName, {pattern: 'first', toneType: 'none'}).replace(/ /g, '')
                        dict.Icon = icon
                        dict.Source = "menu"
                        keys.push(name)
                        appArr.push(dict)
                    }
                } catch (e) {
                    console.log(e)
                }
            }
            appInfoDb.set('appsMenu', appArr)
            console.log('开始菜单app加载完成..')
        })
    }
}