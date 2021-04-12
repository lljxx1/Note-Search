class FlomoService {
  constructor() {}
  async search({ keyword }) {
    console.log('search', keyword)
    const searchUrl = `https://flomoapp.com/api/memo/`
    const { data } = await axios.get(searchUrl, {
      params: {
        query: keyword
      },
    })

    const results = {
      total: 0,
      rows: [],
      searchPageUrl: `https://flomoapp.com/mine?query=${encodeURIComponent(
        keyword
      )}`,
    }

    if (data.code == 0) {
      results.total = data.memos.length
      results.rows = data.memos.map(_ => {
        return {
          title: _.title,
          abstract: _.content,
          url: `https://flomoapp.com/mine?memo_id=${_.slug}`
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
  type: 'Flomo',
  meta: {
    icon: 'https://flomoapp.com/images/logo-192x192.png',
    displayName: 'flomo',
  },
  service: FlomoService,
}

// exports.provider = provider
export default provider
