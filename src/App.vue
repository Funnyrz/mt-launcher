<template>
  <LaunCher/>
</template>

<script>
import LaunCher from './components/LaunCher.vue'

export default {
  name: 'App',
  components: {
    LaunCher
  }
}
</script>

<style>
html {
  height: 100%;
  background-image: linear-gradient(141deg, #9fb8ad 0%, #1fc8db 51%, #2cb5e8 75%);
  background-attachment: fixed;
}

body {
  display: block;
  margin: 0;
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
