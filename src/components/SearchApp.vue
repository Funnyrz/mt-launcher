<template>
  <div class="page">
    <input v-model="keywords" placeholder="输入搜索应用得名字或拼音缩写" @input="search" class="search-keys"
           ref='searchKeys'/>
    <div class="appList" v-for="(app,index) in apps" :key="index" @click="openApp(app.item)">
      <img :src="app.item.Icon" alt="icon" width="50"/>
      <div class="desc">
        <div>{{ app.item.DisplayName }}</div>
        <div class="exe-path">{{ app.item.ExePath }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import appUtil from './util/appUtil'
import Fuse from "fuse.js";
import fs from "fs";
import {shell} from "electron";

export default {
  name: 'SearchPage',
  components: {},
  data() {
    return {
      keywords: '',
      apps: []
    }
  },
  mounted() {
    this.$refs.searchKeys.focus()

  },
  methods: {
    search() {
      if (this.keywords !== '') {
        const menuAppData = appUtil.getMenuAppData()
        const options = {
          includeScore: true,
          keys: ['DisplayName', 'Word']
        }
        const fuse = new Fuse(menuAppData, options)
        this.apps = fuse.search(this.keywords)
        let win = require('@electron/remote').getCurrentWindow();
        win.setBounds({width: 600, height: 500})
        win.center()
      } else {
        let win = require('@electron/remote').getCurrentWindow();
        win.setBounds({width: 600, height: 50})
        win.center()
      }
    }, async openApp(app) {
      fs.access(app.ExePath, fs.constants.F_OK, (err) => {
        if (err) {
          this.$message.warning("应用不存在或已被删除")
          return
        }
        shell.openExternal(app.ExePath)
      })
    }
  }
}
</script>

<style scoped>
.page {
  background-color: #2b2d2f;
}

.appList {
  display: flex;
}

.appList:hover {
  cursor: pointer;
  background-color: #85878a;
}

.appList > img {
  margin: 8px 10px;
}

.appList > div {
  position: relative;
  display: block;
  margin: 8px 0px;
  color: #e5ecee;
  font-weight: bold;
  font-size: 16px;
}

.exe-path {
  position: absolute;
  bottom: 5px;
  font-size: 10px;
  font-weight: bold;
  color: #f0f8ff;
  width: 100%;
  white-space: nowrap;
}

.search-keys {
  width: 100%;
  height: 50px;
  position: sticky;
  top: 0;
  z-index: 999;
}

input {
  background-color: #2b2d2f;
  outline-style: none;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 0 15px;
  color: #c2c5cc;
  font-weight: bold;
  font-size: 16px;
  font-family: "Microsoft soft", serif;
}
</style>
