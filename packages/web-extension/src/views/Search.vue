<template>
  <section id="main-section">
  <el-tabs v-model="activeName">
    <el-tab-pane :label="serviceResult.tabName" :name="serviceResult.serviceType" v-for="serviceResult in allResults" :key="serviceResult.serviceType">
      <div v-for="(item, index) in serviceResult.result.rows" :key="index" class="search-item">
        <h2 style="font-size: 16px;color: #262626;"> {{ item.title }}</h2>
        <p style="font-size: 14px;white-space: nowrap;line-height: 18px; overflow: hidden;text-overflow: ellipsis;" v-html="item.abstract"></p>
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
        _.tabName = `${_.serviceType}(${_.total})`
        return _
      })
      this.activeName = this.allResults[0].serviceType
    }
  },
}
</script>
