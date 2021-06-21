function getCache(name, cb) {
  chrome.extension.sendMessage(
    {
      action: 'getCache',
      name: name,
    },
    function(resp) {
      cb && cb(resp.result[name])
    }
  )
}

function getMultiCache(names, cb) {
  chrome.extension.sendMessage(
    {
      action: 'getCache',
      names: names,
    },
    function(resp) {
      cb && cb(resp.result)
    }
  )
}

function setCache(name, value, cb) {
  chrome.extension.sendMessage(
    {
      action: 'setCache',
      name: name,
      value: value,
    },
    function(resp) {
      cb && cb(resp)
    }
  )
}

function sendEvent(category, action, label) {
  chrome.extension.sendMessage(
    {
      action: 'sendEvent',
      event: {
        category: category,
        action: action,
        label: label
      },
    },
    function(resp) {
      cb && cb(resp)
    }
  )
}


/**
 * 监听节点是否被移除
 * @function
 * @param {Node} target - dom节点
 * @param {function} callback - 移除后回调函数.
 */
function afterNodeRemoved(target, callback) {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      var nodes = Array.from(mutation.removedNodes);
      var directMatch = nodes.indexOf(target) > -1
      var parentMatch = nodes.some(parent => parent.contains(target));
      if (directMatch) {
        after('remove')
      } else if (parentMatch) {
        after('parent')
      }
    });
  });
  function after(type) {
    callback && callback(type)
    observer.disconnect();
  }
  var config = {
    subtree: true,
    childList: true
  };
  observer.observe(document.body, config);
}


class SearchFrame {
  constructor() {
    this._frameContainer = null
    this._changed = null
    this.listen()
  }

  getPageUrl(keyword) {
    var searchPageSrc = chrome.runtime.getURL('index.html')
    var searchPageUrl = `${searchPageSrc}#/search?keyword=` + encodeURIComponent(keyword) + '&rawUrl='+ encodeURIComponent(window.location.href)
    return searchPageUrl
  }

  append(dom, keyword) {
    const searchPageUrl = this.getPageUrl(keyword)
    console.log('searchPageUrl', searchPageUrl)
    this._frameContainer = $(
      '<iframe src="' +
      searchPageUrl +
        '" name="' +
        window.location.href +
        '"></iframe>'
    )
    this._frameContainer.css({
      width: '100%',
      height: '100%',
      padding: '12px 0 5px',
      'min-width': '377px',
      'min-height': '155px',
      border: 'none',
    })
    $(dom).append(this._frameContainer)
    this.afterCreated()
  }

  afterCreated() {
    console.log('afterFrameCreated', 'observe dom remove')
    var target = this._frameContainer[0]
    afterNodeRemoved(target, type => {
      this._changed && this._changed(type);
    })
  }

  afterChanged(handler) {
    this._changed = handler
  }

  updateFrameStyle(style) {
    console.log('updateFrameStyle', style, this._frameContainer)
    if(!this._frameContainer) return;
    this._frameContainer.css(style)
  }

  listen() {
    window.addEventListener('message', evt => {
      try {
        const action = JSON.parse(evt.data)
        console.log('action', action)
        if(action.method == 'noteSearch.frameSetMyStyle') {
          this.updateFrameStyle(action.style)
        }
      } catch (e) {}
    })
  }
}


class SearchFrameGuard {
  constructor(frame) {
    this.searchFrame = frame
    this._pageRules = {}
    this.init()
  }

  addPageHandler(host, handler) {
    this._pageRules[host] = handler
  }

  init() {
    // 监听iframe移除后
    this.searchFrame.afterChanged(_ => {
      console.log('afterChanged', _)
      this.execute()
    })
  }

  execute() {
    var hostName = window.location.hostname;
    let pageFunc = this._pageRules[hostName]
    if(!pageFunc) {
      // 匹配google.com.hk这种情况
      const matchedHosts = Object.keys(this._pageRules).filter(host => hostName.indexOf(host) > -1)
      if(matchedHosts.length != 0) {
        pageFunc = this._pageRules[matchedHosts[0]]
      }
    }
    if(pageFunc) {
      pageFunc((target, type) => {
        this.searchFrame.append(target, type)
      })
    }
  }
}


var searchFrame = new SearchFrame()
var guarder = new SearchFrameGuard(searchFrame)

guarder.addPageHandler('www.baidu.com', handle => {
  ;(function loop() {
    var containerRight = $('#content_right');
    if(containerRight.length) {
      var keyword = $('#kw').val()
      var dom = document.createElement('div');
      containerRight.prepend(dom)
      handle(dom, keyword);
      return;
    }
    setTimeout(loop, 300);
  })();
})


guarder.addPageHandler('www.google.com', handle => {
  ;(function loop() {
    var containers = $('#center_col');
    if(containers.length) {
      setTimeout(_ => {
        var keyword = $('input[name=q]').val()
        var targetNode = $('#rhs');
        if(targetNode.length == 0) {
          targetNode = $('<div id="rhs"></div>')
          var nodeRow = containers.parent();
          nodeRow.after(targetNode)
        }
        var dom = document.createElement('div');
        targetNode.prepend(dom)
        handle(dom, keyword);
      }, 100)
      return;
    }
    setTimeout(loop, 300);
  })();
});


// loading setting and init
getCache('settings', (value) => {
  var disabled = false
  if(value) {
    var settings = JSON.parse(value)
    console.log('settings', settings)
    if(!settings.enable) disabled = true
  }
  if(!disabled) {
    guarder.execute()
  }
})
