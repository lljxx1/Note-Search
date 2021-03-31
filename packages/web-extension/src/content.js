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


function appendSearchFrame(dom, keyword) {
  var searchPageSrc = chrome.runtime.getURL('index.html')
  var searchPageUrl = `${searchPageSrc}#/search?keyword=` + encodeURIComponent(keyword) + '&rawUrl='+ encodeURIComponent(window.location.href)
  console.log('searchPageUrl', searchPageUrl)
  var sPage = $(
    '<iframe src="' +
    searchPageUrl +
      '" name="' +
      window.location.href +
      '"></iframe>'
  )

  sPage.css({
    width: '100%',
    height: '100%',
    'min-height': '300px',
    border: 'none',
  })

  $(dom).append(sPage)
}




var pageRules = {
  'www.baidu.com': function() {;
    (function loop() {
      var containerRight = $('#content_right');
      if(containerRight.length) {
        var keyword = $('#kw').val()
        var dom = document.createElement('div');
        containerRight.prepend(dom)
        appendSearchFrame(dom, keyword);
        return;
      }

      setTimeout(loop, 300);
    })();

  }
}


var pageFunc = pageRules[window.location.hostname]
if (pageFunc) {
  pageFunc()
}
