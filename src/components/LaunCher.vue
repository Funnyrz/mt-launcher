<template>
  <div>
    <div class="search">
      <el-input v-model="keywords" placeholder="搜索" @input="search"></el-input>
    </div>
    <div class="parent" v-if="!isSearch">
      <div class="child" v-for="(app,index) in apps" v-on:dblclick="openApp(app)"
           @contextmenu.prevent="$refs.ctxMenu.open('',{'index':index,'data':app})" :key="index">
        <div class="app">
          <img :src="app.Icon" alt="icon">
          <div class="desc">
            {{ app.LegalName }}
          </div>
        </div>
      </div>
    </div>
    <div class="parent" v-if="isSearch">
      <div class="child" v-for="(app,index) in apps" v-on:click.once="openApp(app)" :key="index">
        <div class="app">
          <img :src="app.item.Icon" alt="icon">
          <div class="desc">
            {{ app.item.LegalName }}
          </div>
        </div>
      </div>
    </div>
    <context-menu id="context-menu" ref="ctxMenu">
      <li @click="openApp($refs.ctxMenu.locals.data)">打开</li>
      <li @click="openDir()">打开文件夹</li>
      <li @click="removeApp($refs.ctxMenu.locals.index)">移除</li>
      <li @click="uninstallApp($refs.ctxMenu.locals.data)">卸载</li>
    </context-menu>
  </div>
</template>

<script>
import path from "path";

import {shell} from 'electron'
import {appInfoDb} from './util/dbUtil'
import appUtil from './util/appUtil'

import Fuse from 'fuse.js'
import {pinyin} from 'pinyin-pro';
import contextMenu from 'vue3-ctx-menu'
import fs from "fs";
export default {
  name: 'LaunCher',
  components: {contextMenu},
  data() {
    return {
      apps: [],
      keywords: '',
      isSearch: false,
      loading: {},
    }
  },
  created() {
    this.init()
    this.dropFile()
  },
  methods: {
    init() {
      if (!localStorage.getItem("start_flag")) {
        //第一次启动
        this.loading = this.$loading({
          lock: true,
          text: '首次启动程序,正在加载应用,请稍等...',
          spinner: 'el-icon-loading',
          background: 'rgba(255,255,255,0.7)'
        });
        appUtil.getAppList(this.getAppListCall)
        localStorage.setItem("start_flag", "true")
      } else {
        this.apps = appUtil.getAppData()
      }
    },
    getAppListCall(ret) {
      let apps = appUtil.getAppData()
      apps.push(...ret)
      this.apps = apps
      appInfoDb.set('appsReg', apps)
      this.loading.close()
    },
    uninstallApp(data) {
      if (data.UninstallString) {
        appUtil.unInstallApp(data.UninstallString, function (data) {
          console.log(data)
        })
      } else {
        this.$confirm('当前应用不支持卸载,请到系统控制面板卸载.绿色版直接删除文件夹即可', '提示', {
          confirmButtonText: '跳转到控制面板',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          appUtil.toUnInstallPanel()
        }).catch(() => {

        });
      }

    }
    ,
    removeApp(index) {
      this.$confirm('此操作只会移除当前应用对其他软件的启动管理,不会卸载或删除.确定要继续吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const currApp = this.apps[index]
        this.apps.splice(index, 1)
        if (currApp.Source === 'lnk') {
          let lnkApps = appUtil.getLnkAppData()
          lnkApps.splice(index, 1)
          appInfoDb.set('appsLnk', lnkApps)
        } else if (currApp.Source === 'registry') {
          let lnkApps = appUtil.getLnkAppData()
          let regApps = appUtil.getRegAppData()
          regApps.splice(index - lnkApps.length, 1)
          appInfoDb.set('appsReg', regApps)
        }

      }).catch(() => {

      });
    }
    ,
    openDir() {
      shell.showItemInFolder(this.$refs.ctxMenu.locals.data.ExePath)
    }
    ,
    search() {
      if (this.keywords === '') {
        this.isSearch = false
        this.apps = appUtil.getAppData()
      } else {
        const options = {
          includeScore: true,
          keys: ['DisplayName', 'Word']
        }
        const fuse = new Fuse(appUtil.getAppData(), options)
        this.apps = fuse.search(this.keywords)
        this.isSearch = true
      }
    }
    ,
    async openApp(app) {
      fs.access(app.ExePath, fs.constants.F_OK, (err) => {
        if (err) {
          this.$message.warning("应用不存在或已被删除")
          return
        }
        shell.openExternal(app.ExePath)
      })
    }
    ,
    // 文件拖动
    dropFile() {
      document.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        let addLnkApps = []
        for (const f of e.dataTransfer.files) {
          const filePath = f.path
          const name = f.name
          const retLnk = shell.readShortcutLink(filePath)
          const exePath = retLnk.target;
          const data = await appUtil.getIconInfo(exePath)
          let appName = name.replace(".lnk", '')
          const icon = path.join(require('@electron/remote').app.getPath('userData'), 'icons', `${appName}.png`)
          const dataBuffer = new Buffer(data, 'base64')
          const write = require('write')
          write.sync(icon, dataBuffer, {overwrite: true})
          const word = pinyin(appName, {pattern: 'first', toneType: 'none'}).replace(/ /g, '')
          let appInfo = {
            "LegalName": appName,
            "Lnk": filePath,
            "Icon": icon,
            "Word": word,
            "ExePath": exePath,
            "Source": "lnk"
          }
          addLnkApps.push(appInfo)
        }
        let lnkApps = appUtil.getLnkAppData()
        lnkApps.push(...addLnkApps)
        appInfoDb.set('appsLnk', lnkApps)
        this.init()
      });
      document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }
    ,

  }
}
</script>

<style>
.parent {
  display: flex;
  flex-flow: row wrap;
  align-content: center;
}

.child {
  margin: 10px 0;
  box-sizing: border-box;
  flex: 0 0 14.285%;
  text-align: center;
}

.desc {
  color: #ffffff;
  font-size: 14px;
}

.app {
  padding: 15px 30px;
  display: inline-block;
  vertical-align: middle;
  max-width: 50%;
  cursor: pointer;
}

.app > img {
  width: 100%;
}

.app:hover {
  background: rgba(102, 159, 184, 0.66);
  border-radius: 14px;
}

.search {
  padding-top: 10px;
  width: 40%;
  position: relative;
  margin: auto;
}

.ctx-menu {
  position: absolute;
  top: 100%;
  z-index: 1000;
  display: none;
  /*min-width: 70px;*/
  font-size: 1rem;
  color: #373a3c;
  text-align: left;
  list-style: none;
  -webkit-background-clip: padding-box;
  background-clip: padding-box;
  border: 1px solid rgba(0, 0, 0, .15);
  border-radius: .3rem;
  -moz-box-shadow: 0 0 5px #ccc;
  -webkit-box-shadow: 0 0 5px #ccc;
  box-shadow: 0 0 5px #ccc;
  background-color: #ecf0f1;
  font-weight: bold;
}

.ctx-menu > li {
  padding: 10px 20px;
  cursor: pointer;
}

.ctx-menu > li:hover {
  background: #9fb8ad;
}
</style>