<template>
  <div class="page">
    <input v-model="keywords" placeholder="输入搜索应用的名字或拼音缩写" @input="search" class="search-keys"
           ref='searchKeys'/>
    <el-scrollbar>
      <div class="appList" v-for="(app,index) in apps" :key="index" @click="openApp(app.item)" @keyup.down="keyDown">
        <img :src="app.item.Icon" alt="icon" width="50"/>
        <div class="desc">
          <div>{{ app.item.DisplayName }}</div>
          <div class="exe-path">{{ app.item.ExePath }}</div>
        </div>
      </div>
      <div class="emptyData" v-if="apps.length===0">
        暂无数据
      </div>
    </el-scrollbar>
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
    this.keyDown()
  },
  methods: {
    keyDown() {
      document.onkeydown = (e) => {
        //事件对象兼容
        let e1 = e || event || window.event
        if (e1 && e1.keyCode == 13) {
          //回车键
          let appActDiv = document.getElementsByClassName("activate")[0]
          appActDiv.click()
          require('@electron/remote').getCurrentWindow().hide()
        }
        if (e1 && e1.keyCode == 27) {
          //Esc
          require('@electron/remote').getCurrentWindow().hide()
        }
        if (e1 && e1.keyCode == 38) {
          // 按上箭头
          let appActDiv = document.getElementsByClassName("activate")[0]
          if (appActDiv.previousElementSibling !== null) {
            appActDiv.classList.remove('activate')
            appActDiv.previousElementSibling.classList.add('activate')
          }

        } else if (e1 && e1.keyCode == 40) {
          // 按下箭头
          let appActDiv = document.getElementsByClassName("activate")[0]
          if (appActDiv.nextElementSibling !== null) {
            appActDiv.classList.remove('activate')
            appActDiv.nextElementSibling.classList.add('activate')
          }
        }
      }
    },
    search() {
      if (this.keywords !== '') {
        const menuAppData = appUtil.getMenuAppData()
        const options = {
          includeScore: true,
          keys: ['DisplayName', 'Word']
        }
        const fuse = new Fuse(menuAppData, options)
        this.apps = fuse.search("^"+this.keywords)
        if (this.apps.length > 0) {
          this.$nextTick(() => {
            let appDiv = document.getElementsByClassName("appList")[0]
            appDiv.classList.add('activate')
          })
        }

      } else {
        this.apps = []
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
  overflow-y: hidden;
  overflow-x: hidden;
  height: 500px;
  background-color: #2b2d2f;
}

.appList {
  display: flex;
}

.activate {
  cursor: pointer;
  background-color: #85878a;
}

.appList:hover {
  cursor: pointer;
  /*background-color: #85878a;*/
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

.emptyData {
  margin-top: 20px;
  text-align: center;
  font-weight: bold;
  font-size: 18px;
  color: #f0f2f5;
}
</style>
