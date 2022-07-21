<template>
  <div>
    <div class="search">
      <el-input v-model="keywords" placeholder="搜索" @input="search"></el-input>
    </div>
    <div class="parent" v-if="!isSearch">
      <div class="child" v-for="(app,index) in apps" v-on:dblclick="openApp(app)"
           @contextmenu.prevent="$refs.ctxMenu.open(this,{'index':index,'data':app})">
        <div class="app">
          <img :src="app.icon" alt="icon">
          <div class="desc">
            {{ app.appName }}
          </div>
        </div>
      </div>
    </div>
    <div class="parent" v-if="isSearch">
      <div class="child" v-for="app in apps" v-on:click.once="openApp(app)">
        <div class="app">
          <img :src="app.item.icon" alt="icon">
          <div class="desc">
            {{ app.item.appName }}
          </div>
        </div>
      </div>
    </div>
    <context-menu id="context-menu" ref="ctxMenu">
      <li @click="openApp($refs.ctxMenu.locals.data)">打开</li>
      <li @click="openDir()">打开文件夹</li>
      <li @click="removeApp($refs.ctxMenu.locals.index)">删除</li>
      <li @click="uninstallApp($refs.ctxMenu.locals.index)">卸载</li>
    </context-menu>
  </div>
</template>

<script>
const {shell} = require('electron')
const iconPromise = require('icon-promise');
const {lnk} = require('./util/dbUtil')
const Fuse = require('fuse.js')
import {pinyin} from 'pinyin-pro';
import contextMenu from 'vue-context-menu'

export default {
  name: 'index-page',
  components: {contextMenu},
  data() {
    return {
      apps: [],
      keywords: '',
      isSearch: false,
    }
  },
  created() {
    this.apps = this.getLnkData()
    this.dropFile()
  },
  methods: {
    uninstallApp() {
      this.$message.error({
        showClose: true,
        message: '这是一条消息提示',
        duration: '2000'
      });
    },
    removeApp(index) {
      this.$confirm('此操作只会移除当前应用对其他软件的启动管理,不会卸载或删除.确定要继续吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.apps.splice(index, 1)
        lnk.set('apps', this.apps)
      }).catch(() => {

      });
    },
    openDir() {
      shell.showItemInFolder(this.$refs.ctxMenu.locals.data.exePath)
    },
    search() {
      if (this.keywords === '') {
        this.isSearch = false
        this.apps = this.getLnkData()
      } else {
        const options = {
          includeScore: true,
          keys: ['appName', 'word']
        }
        const fuse = new Fuse(this.getLnkData(), options)
        this.apps = fuse.search(this.keywords)
        this.isSearch = true
      }
    },
    async getIconInfo(exePath) {
      const {Base64ImageData} = await iconPromise.getIcon256(exePath)
      return "data:image/png;base64," + Base64ImageData
    },
    async openApp(app) {
      shell.openExternal(app.lnk)
    },
    // 文件拖动
    dropFile() {
      document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        for (const f of e.dataTransfer.files) {
          const filePath = f.path
          const name = f.name
          const retLnk = shell.readShortcutLink(filePath)
          const exePath = retLnk.target;
          this.getIconInfo(exePath).then((data) => {
            let appName = name.replace(".lnk", '')
            const word = pinyin(appName, {pattern: 'first', toneType: 'none'})
            let app = {"appName": appName, "lnk": filePath, "icon": data, "word": word, "exePath": exePath}
            this.apps.splice(this.apps.length, 1, app)
            lnk.set('apps', this.apps)
          })
        }
      });
      document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    },
    getLnkData() {
      return Object.keys(lnk.get('apps')).length === 0 ? [] : lnk.get('apps').data
    }
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
  border-radius: 20px;
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
