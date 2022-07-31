import {createRouter, createWebHistory, createWebHashHistory} from 'vue-router'
import LaunCher from '@/components/Launcher'
import SearchApp from '@/components/SearchApp'

//路由数组
const routes = [

    {
        //基本格式
        path: "/",

        name: "launcher-page",

        component: LaunCher,

        children: []

    },
    {
        //基本格式
        path: "/searchApp",

        name: "search-page",

        component: SearchApp,

        children: []

    }

]

//路由对象
const router = createRouter({

    history: process.env.IS_ELECTRON ? createWebHashHistory() : createWebHistory(),

    routes //上面的路由数组

})

//导出路由对象，在main.js中引用
export default router