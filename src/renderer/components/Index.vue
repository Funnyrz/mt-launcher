<template>
  <div class="parent">
    <div class="child" v-for="app in apps" v-on:click.once="openApp(app)">
      <div class="app">
        <img :src="app.icon" alt="icon">
        <div class="desc">
          {{ app.appName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const {shell} = require('electron')
var iconPromise = require('icon-promise');
export default {
  name: 'index-page',
  components: {},
  data() {
    return {
      apps: [],
    }
  },
  created() {
    this.apps = JSON.parse(localStorage.getItem("apps"))
    this.dropFile()
  },
  methods: {
    async getIconInfo(exePath) {
      const {Base64ImageData} = await iconPromise.getIcon256(exePath)
      return "data:image/png;base64," + Base64ImageData

    },
    async openApp(app) {
      shell.openExternal(app.lnk)
    },
    // 文件拖动
    dropFile() {
      const fs = require('fs')
      document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        let apps = localStorage.getItem("apps") === null ? [] : JSON.parse(localStorage.getItem("apps"))
        for (const f of e.dataTransfer.files) {
          const filePath = f.path
          const name = f.name
          const retLnk = shell.readShortcutLink(filePath)
          console.log("retLnk" + retLnk)
          const exePath = retLnk.target;
          this.getIconInfo(exePath).then((data) => {
            let appName = name.replace(".lnk", '')
            let app = {"appName": appName, "lnk": filePath, "icon": data}
            this.apps.splice(this.apps.length, 1, app)
            localStorage.setItem("apps", JSON.stringify(this.apps))
          })
        }
      });
      document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    },
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
  max-width: 40%;
  cursor: pointer;
}

.app > img {
  width: 100%;
}

.app:hover {
  background: rgba(102, 159, 184, 0.66);
}

</style>
