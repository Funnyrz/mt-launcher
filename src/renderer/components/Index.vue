<template>
  <div>
    <div class="search">
      <el-input v-model="keywords" placeholder="搜索" @input="search"></el-input>
    </div>
    <div class="parent" v-if="!isSearch">
      <div class="child" v-for="app in apps" v-on:click.once="openApp(app)">
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
  </div>
</template>

<script>
const {shell} = require('electron')
const iconPromise = require('icon-promise');
const {lnk} = require('./util/dbUtil')
const Fuse = require('fuse.js')
export default {
  name: 'index-page',
  components: {},
  data() {
    return {
      apps: [],
      keywords: '',
      isSearch: false,
    }
  },
  created() {
    this.loadData()
    this.dropFile()
  },
  methods: {
    search() {
      if (this.keywords === '') {
        this.isSearch = false
        this.loadData()
      } else {
        const options = {
          includeScore: true,
          keys: ['appName']
        }
        const fuse = new Fuse(this.apps, options)
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
            let app = {"appName": appName, "lnk": filePath, "icon": data}
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
    loadData() {
      this.apps = Object.keys(lnk.get('apps')).length === 0 ? [] : lnk.get('apps').data
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

</style>
