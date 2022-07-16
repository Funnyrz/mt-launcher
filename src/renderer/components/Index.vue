<template>
  <div class="parent">
    <div class="child" v-for="app in apps" v-on:click.once="openApp(app)">
      <div class="app">
        <img src="static/app.png" alt="icon" width="150">
        <div class="desc">
          {{ app.appName }}
        </div>
      </div>
    </div>
    <div class="child" v-for="app in apps" v-on:click.once="openApp(app)">
      <div class="app">
        <img src="static/app.png" alt="icon" width="150">
        <div class="desc">
          {{ app.appName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const {shell} = require('electron')
export default {
  name: 'index-page',
  components: {},
  data() {
    return {
      apps: JSON.parse(localStorage.getItem("apps"))
    }
  },
  created() {
    this.dropFile()
  },
  methods: {
    openApp(app) {
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
          this.filePath = f.path
          let ret = shell.readShortcutLink(this.filePath)
          console.log(ret)
          const appName = ret.description
          let app = {"appName": appName, "lnk": this.filePath}
          apps.push(app)
          localStorage.setItem("apps", JSON.stringify(apps))
        }
        // 设置编码格式
        fs.readFile(this.filePath, 'utf-8', function (err, data) {
          // 读取文件失败/错误
          if (err) {
            throw err;
          }
          // console.log('utf-8: ', data.toString());
          //直接用console.log(data);也可以
          console.log(JSON.parse(localStorage.getItem("apps")))
        });
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
}

.child {
  margin: 10px 0;
  float: left;
  width: 25%;
  text-align: center;
}

.desc {
  color: #ffffff
}

.app {
  padding: 15px 30px;
  display: inline-block;
  vertical-align: middle;
  max-width: 160px;
  cursor: pointer;
}

.app:hover {
  background: rgba(102, 159, 184, 0.66);
}
</style>
