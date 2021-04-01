<template>
  <section id="search-section">
    <el-card class="box-card" :body-style="{ padding: '5px 20px 15px 20px' }">
  <div slot="header" class="clearfix">
    <span style="font-size: 16px; font-weight: bold">笔记搜索</span>
    <el-button style="float: right; padding: 3px 0" type="text" icon="el-icon-close"></el-button>
  </div>
  <el-tabs v-model="activeName" >
    <el-tab-pane :label="serviceResult.tabName" :name="serviceResult.serviceType" v-for="serviceResult in allResults" :key="serviceResult.serviceType">
      <div v-for="(item, index) in serviceResult.result.rows" :key="index" class="search-item">
        <a :href="item.url" target="_blank">
          <h2 style="font-size: 16px;color: #262626;">
          {{ item.title }}
          </h2>
          <div class="item-desc" style="" v-html="item.abstract">
          </div>
        </a>
      </div>
    </el-tab-pane>
  </el-tabs>
</el-card>

  </section>
</template>

<script>
import { callAllServiceMethod } from '../providers/factory'
export default {
  data() {
    return {
      activeName: null,
      allResults: [],
    }
  },
  mounted() {
    this.searchAll()
  },
  methods: {
    async searchAll() {
      const keyword = this.$route.query.keyword
      const allResults = await callAllServiceMethod('search', [{
        keyword: keyword
      }])
      console.log(allResults)
      this.allResults = allResults.filter(_ => _.result.rows.length).map(_ => {
        _.tabName = `${_.displayName}(${_.result.total})`
        return _
      })
      this.activeName = this.allResults[0].serviceType
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
}

.search-item .item-desc
{
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

.search-item .item-desc em {
  color: #c73632;
  font-style: normal;
}
</style>
