import {pinyin} from "pinyin-pro";
import {appInfoDb} from "./dbUtil";

/**
 * 代码参考
 * https://github.com/zhujiaming/uTools-AppUninstaller/blob/master/preload.js
 */

const path = require("path")
const child = require('child_process')
const iconv = require('iconv-lite')
const iconPromise = require('icon-promise')
const write = require('write')

function powershell(cmd, callback) {
    const ps = child.spawn('powershell', ['-NoProfile', '-Command', cmd], {encoding: 'buffer'})
    let chunks = [];
    let err_chunks = [];
    ps.stdout.on('data', chunk => {
        chunks.push(iconv.decode(chunk, 'cp936'))
    })
    ps.stderr.on('data', err_chunk => {
        err_chunks.push(iconv.decode(err_chunk, 'cp936'))
    })
    ps.on('close', code => {
        let stdout = chunks.join("");
        let stderr = err_chunks.join("");
        callback(stdout, stderr)
    })
}

export function getAppList(callback) {
    let filterValues = "Select-Object DisplayName,DisplayIcon,UninstallString,DisplayVersion,InstallDate,Publisher,InstallLocation"
    let localMatcine = `Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
    let currentUser = `Get-ItemProperty HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
    let Wow6432Node = `Get-ItemProperty HKLM:\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | ${filterValues}`;
    let x64 = process.arch === 'x64' ? `;${Wow6432Node}` : '';
    powershell(`${localMatcine};${currentUser}${x64}`, async (stdout, stderr) => {
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
                if (filterApps(dict)) {
                    dict.LegalName = dict.DisplayName.replace(/[\\\/\:\*\?\"\<\>\|]/g, "");
                    dict.ExePath = dict.DisplayIcon.replace(/(,0|")/g, "")
                    const {app} = require('electron').remote
                    const icon = path.join(app.getPath('userData'), 'icons', `${dict.LegalName}.png`)
                    const {Base64ImageData} = await iconPromise.getIcon256(dict.ExePath)
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
}

function filterApps(dict) {
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

}

export function unInstallApp(command, callback) {
    command = command.replace(/(^[A-z]:\\[\S ]+\\\S+)($| )/, '"$1"$2')
    child.exec(command, {encoding: 'buffer'}, (err, stdout, stderr) => {
        if (err) {
            callback(iconv.decode(stderr, 'cp936'));
        }
    })
}

export function toUnInstallPanel() {
    let command = 'control /name Microsoft.ProgramsAndFeatures'
    command = command.replace(/(^[A-z]:\\[\S ]+\\\S+)($| )/, '"$1"$2')
    child.exec(command, {encoding: 'buffer'}, (err, stdout, stderr) => {
        if (err) {
            console.log(err)
        }
    })
}

export function getAppData() {
    let appsLnk = Object.keys(appInfoDb.get('appsLnk')).length === 0 ? [] : appInfoDb.get('appsLnk').data
    let appsReg = Object.keys(appInfoDb.get('appsReg')).length === 0 ? [] : appInfoDb.get('appsReg').data
    appsLnk.push(...appsReg)
    return appsLnk
}

export function getLnkAppData() {
    return Object.keys(appInfoDb.get('appsLnk')).length === 0 ? [] : appInfoDb.get('appsLnk').data
}

export function getRegAppData() {
    return Object.keys(appInfoDb.get('appsReg')).length === 0 ? [] : appInfoDb.get('appsReg').data
}
