
function cleanHtml(str){
  return str.replace(/<[^>]+>/g,"")
}

function highlight(text, keyword) {
  return text.split(keyword).join('<em>'+keyword+'</em>')
}

class DiigoService {
  constructor() {}

  async search({ keyword }) {
    console.log('search', keyword)
    const searchUrl = `https://www.diigo.com/interact_api/search_user_items`
    const { data } = await axios.get(searchUrl, {
      params: {
        what: keyword,
        sort: 'updated',
        count: 24,
        format: 'json',
      },
    })

    const results = {
      total: 0,
      rows: [],
    }

    if (data.total) {
      results.total = data.total
      results.rows = data.items.map(_ => {
        return {
          title: _.title,
          abstract: highlight(cleanHtml(_.note_content).substr(0, 100), keyword),
          url: _.url,
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
  type: 'Diigo',
  meta: {
    displayName: 'Diigo',
    icon: 'https://www.diigo.com/favicon.ico',
  },
  service: DiigoService,
}

export default provider
