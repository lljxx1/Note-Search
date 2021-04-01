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

class NotionService {
  constructor() {
    modifyRequestHeaders(
      'www.notion.so/api/v3',
      {
        Origin: 'https://www.notion.so',
        Referer: 'https://www.notion.so/',
      },
      ['*://www.notion.so/api/v3*'],
      function(details) {
        // parse token from cookie inject to headers
        if (details.url.indexOf('www.notion.so/api/v3') > -1) {
          parseTokenAndToHeaders(
            details,
            'notion_user_id',
            'x-notion-active-user-header'
          )
        }
      }
    )
  }

  async getWorkSpace() {
    const instance = axios.create({})
    const fetch = axiosFetch.buildAxiosFetch(instance)
    const req = await fetch('https://www.notion.so/api/v3/getSpaces', {
      headers: {
        accept: '*/*',
        'accept-language': 'zh-CN,zh;q=0.9,en-IN;q=0.8,en;q=0.7,ar;q=0.6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'notion-client-version': '23.7.62.17',
        pragma: 'no-cache',
      },
      referrer: 'https://www.notion.so/',
      referrerPolicy: 'same-origin',
      body: '{}',
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    })
    const data = await req.json()
    const firstKey = Object.keys(data)[0]
    return Object.keys(data[firstKey].space)
  }

  async search({ keyword }) {
    console.log('search', keyword, this)
    const workspaceIds = await this.getWorkSpace()
    console.log('workspaceIds', workspaceIds)
    const searchUrl = `https://www.notion.so/api/v3/search`
    const { data } = await axios.post(searchUrl, {
      type: 'BlocksInSpace',
      query: keyword,
      spaceId: workspaceIds[0],
      limit: 20,
      filters: {
        isDeletedOnly: false,
        excludeTemplates: false,
        isNavigableOnly: false,
        requireEditPermissions: false,
        ancestors: [],
        createdBy: [],
        editedBy: [],
        lastEditedTime: {},
        createdTime: {},
      },
      sort: 'Relevance',
      source: 'quick_find',
    })

    const results = {
      total: 0,
      rows: [],
      searchPageUrl: null,
    }

    if (data.total) {
      results.total = data.total
      const recordMap = data.recordMap.block
      results.rows = data.results
        .map(_ => {
          var parsedItem = null
          try {
            var recordItem = recordMap[_.id].value
            var parentItem = recordMap[recordItem.parent_id].value
            var linkId = `${recordItem.parent_id}#${_.id}`.split('-').join('')
            if (!parentItem.properties.title) {
              console.log('parentItem', parentItem.properties)
            }
            if (!recordItem.properties.title) {
              console.log('parentItem', recordItem.properties)
            }
            parsedItem = {
              title: parentItem.properties.title[0][0],
              abstract: recordItem.properties.title[0][0],
              highlightAbstract: _.highlight ? _.highlight.text : null,
              url: `https://www.notion.so/${linkId}`,
            }
          } catch (e) {
            console.log('parseItem.error', e, 'row', _)
          }
          return parsedItem
        })
        .filter(_ => _)
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
  type: 'Notion',
  meta: {
    icon: 'https://www.notion.so/images/favicon.ico',
    displayName: 'Notion',
  },
  service: NotionService,
}

export default provider
