let cacheSpaceMeta = null

function getCookie(name, cookieStr) {
  let arr,
    reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)')
  if ((arr = cookieStr.match(reg))) {
    return unescape(arr[2])
  } else {
    return ''
  }
}

function parseTokenAndToHeaders(details, cookieKey, headerKey) {
  var cookieHeader = details.requestHeaders.filter(h => {
    return h.name.toLowerCase() == 'cookie'
  })
  if (cookieHeader.length) {
    var cookieStr = cookieHeader[0].value
    var _xsrf = getCookie(cookieKey, cookieStr)
    if (_xsrf) {
      details.requestHeaders.push({
        name: headerKey,
        value: _xsrf,
      })
    }
  }
}

class WolaiService {
  constructor() {
    modifyRequestHeaders(
      'api.wolai.com',
      {
        Origin: 'https://www.wolai.com',
        Referer: 'https://www.wolai.com/',
      },
      ['*://api.wolai.com*']
    )
  }

  async getWorkSpace() {
    if (cacheSpaceMeta == null) {
      const instance = axios.create({})
      const fetch = axiosFetch.buildAxiosFetch(instance)
      const req = await fetch(
        'https://api.wolai.com/v1/transaction/getUserData',
        {
          headers: {
            accept: '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en-IN;q=0.8,en;q=0.7,ar;q=0.6',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'notion-client-version': '23.7.62.17',
            pragma: 'no-cache',
          },
          referrerPolicy: 'same-origin',
          body: '{}',
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
        }
      )
      const data = await req.json()
      cacheSpaceMeta = data
    }
    return cacheSpaceMeta.data.workspaces.map(_ => _.id)
  }

  async search({ keyword }) {
    console.log('search', keyword, this)
    const workspaceIds = await this.getWorkSpace()
    console.log('workspaceIds', workspaceIds)
    const searchUrl = `https://api.wolai.com/v1/transaction/advancedSearch`
    const { data } = await axios.post(searchUrl, {
      query: keyword,
      workspaceId: workspaceIds[0],
      fuzzy: 'true',
      order: 'desc',
      active: '1',
    })

    const results = {
      total: 0,
      rows: [],
      searchPageUrl: null,
    }

    if (data.data.result) {
      results.total = data.data.result.items.length
      results.rows = data.data.result.items.map(_ => {
        return {
          title: _.title,
          abstract: _.text_content,
          url: `https://www.wolai.com/${_.page_id}#${_.id}`,
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
  type: 'Wolai',
  service: WolaiService,
}

export default provider
