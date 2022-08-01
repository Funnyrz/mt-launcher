<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* CSS */
html {
  background-color: #2b2d2f;
  height: 100%;
}

body {
  display: block;
  margin: 0;
  padding: 0;
}

/* 滚动条美化 */
::-webkit-scrollbar { /*滚动条整体样式*/
  width: 6px; /*高宽分别对应横竖滚动条的尺寸*/
  height: 0;
}

/*滚动条滑块隐藏*/
::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background: rgba(0, 0, 0, 0);
}

/*按下滚动条，颜色加深*/
::-webkit-scrollbar-thumb:active {
  border-radius: 10px;
  background: rgba(0, 0, 0, .5);
}

/*鼠标浮到容器上，让该容器的滚动条滑块显示*/
:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, .2);
}

/*滚动条轨道*/
::-webkit-scrollbar-track {
  border-radius: 10px;
  background: rgba(0, 0, 0, 0);
}
</style>