class YuQueService {
  constructor() {}
  async search({ keyword }) {
    console.log('search', keyword)
    const searchUrl = `https://www.yuque.com/api/zsearch`
    const { data } = await axios.get(searchUrl, {
      params: {
        p: 1,
        q: keyword,
        related: true,
        scope: null,
        type: 'content',
      },
    })

    const results = {
      total: 0,
      rows: [],
      searchPageUrl: `https://www.yuque.com/search?p=1&q=${encodeURIComponent(
        keyword
      )}&related=true`,
    }

    if (data.data.totalHits) {
      results.total = data.data.totalHits
      results.rows = data.data.hits.map(_ => {
        return {
          title: _.title,
          abstract: _.abstract,
          url: `https://yuque.com${_.url}`,
          collectionName: _.book_name,
          workspaceName: _.group_name,
        }
      })
    }

    return results
  }
}

const provider = {
  features: {
    searchable: true,
    pagination: true,
    countable: true,
  },
  type: 'YuQue',
  displayName: '语雀',
  service: YuQueService,
}

export default provider
