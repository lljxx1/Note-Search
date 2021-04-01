<template>
  <section id="search-section" v-loading="loading">
    <el-card class="box-card" shadow="never" :body-style="{ padding: '5px 20px 15px 20px' }">
      <div slot="header" class="clearfix">
        <span style="font-size: 16px; font-weight: bold">
          <img src="images/logo.png" style="vertical-align: -6px;" height="25px"/>
          笔记搜索
        </span>
        <el-button @click="closeMe" style="float: right; padding: 3px 0" type="text" icon="el-icon-close"></el-button>
      </div>
      <el-tabs v-model="activeName" @tab-click="afterTabChange">
        <el-tab-pane :name="serviceResult.serviceType" v-for="serviceResult in allResults" :key="serviceResult.serviceType">
          <span slot="label">
            <img style="vertical-align: -3px; margin-right: 2px" :src="serviceResult.meta.icon" height="16" />
            {{ serviceResult.tabName }}
          </span>
          <div class="search-result-container" >
            <div v-for="(item, index) in serviceResult.result.rows" :key="index" class="search-item">
              <a :href="item.url" target="_blank">
                <h2>
                  {{ item.title }}
                </h2>
                <div class="item-desc" style="" v-html="item.highlightAbstract ? item.highlightAbstract : item.abstract">
                </div>
              </a>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <div v-if="loading">
        搜索笔记中...
      </div>
      <div v-if="noResult">
        笔记中没有相关搜索结果!
      </div>
    </el-card>
  </section>
</template>

<script>
import { callAllServiceMethod } from '../providers/factory'
export default {
  data() {
    return {
      loading: false,
      activeName: null,
      noResult: false,
      allResults: [],
    }
  },
  mounted() {
    this.searchAll()
  },
  methods: {
    closeMe() {
      this.brodCastStyleChange({
        display: 'none'
      })
    },
    afterTabChange() {
      console.log('tab changed', document.documentElement.scrollHeight)
      this.$nextTick(_ => {
        // this.brodcastHeight()
      })
    },
    brodcastHeight() {
      var appHeight = document.querySelector("#app").clientHeight
      // console.log('appHeight', appHeight)
      // window.top.postMessage(JSON.stringify({
      //   method: 'noteSearch.frameSetMyStyle',
      //   style: {
      //     'height': `${appHeight}px`
      //   }
      // }), '*')
      this.brodCastStyleChange({
        'height': `${appHeight}px`
      })
    },
    brodCastStyleChange(style) {
      window.top.postMessage(JSON.stringify({
        method: 'noteSearch.frameSetMyStyle',
        style: style
      }), '*')
    },
    async searchAll() {
      this.loading = true
      try {
        const keyword = this.$route.query.keyword
        const allResults = await callAllServiceMethod('search', [{
          keyword: keyword
        }])
        console.log(allResults)
        this.allResults = allResults.filter(_ => _.result.rows.length).map(_ => {
          _.tabName = `${_.meta.displayName}(${_.result.total})`
          return _
        })
        this.activeName = this.allResults[0].serviceType
      } catch (e) {

      }
      this.loading = false
      this.noResult = !this.allResults.length

      if(this.noResult) {
        this.brodCastStyleChange({
          'min-height': '120px'
        })
      } else {
        this.brodCastStyleChange({
          'min-height': '300px'
        })
      }
    }
  },
}
</script>
<style >
/* #search-section {
  background: #f4f4f4;
  border: 1px solid #ddd;
} */

#search-section .search-item {
  /* padding: 5px 15px; */
  margin-bottom: 12px;
}

#search-section .search-item h2 {
  font-size: 16px;
  color: #262626;
}

.search-item .item-desc {
  color: #999;
  font-size: 14px;
  line-height: 18px;
  /* overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.search-item .item-desc gzknfouu,
.search-item .item-desc em {
  color: #c73632;
  font-style: normal;
}

.search-result-container {
  max-height: calc(100vh - 60px - 90px);
  overflow-y: auto;
}
</style>
