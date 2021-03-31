<template>
  <section id="search-section">
  <el-tabs v-model="activeName">
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
      this.allResults = allResults.filter(_ => _.result.rows.length).map(_ => {
        _.tabName = `${_.serviceType}(${_.result.total})`
        return _
      })
      this.activeName = this.allResults[0].serviceType
    }
  },
}
</script>
<style >
#search-section {
  background: #f4f4f4;
  border: 1px solid #ddd;
}

#search-section .search-item {
  padding: 5px 15px;
}

 .search-item .item-desc
{
  color: #999;
  font-size: 14px;white-space: nowrap;line-height: 18px; overflow: hidden;text-overflow: ellipsis;
}
</style>
