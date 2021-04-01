import Vue from 'vue'
import VueRouter from 'vue-router'
import Option from './views/Option.vue'
import Search from './views/Search.vue'
// import Mint from 'mint-ui'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(ElementUI)

// Vue.use(Mint)
Vue.use(VueRouter)

var routes = [
  {
    path: '/',
    component: Option,
  },
  {
    path: '/search',
    component: Search,
    meta: {
      index: 1,
    },
  }
]


import { initializeDriver, getDriverProvider, initDevRuntimeEnvironment } from '@/runtime'

// var serviceFactory = require('./providers/factory')
initDevRuntimeEnvironment();


var router = new VueRouter({
  routes,
})
const app = new Vue({
  router,
})
app.$mount('#app')
