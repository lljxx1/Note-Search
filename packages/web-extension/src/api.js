var _appNamespace = require('./config').config._appNamespace;

function testFunc(_appNamespace) {
  var poster = {
    versionNumber: 1,
    dev: process.env.WECHAT_ENV === 'development',
  }

  var eventCb = {}
  function callFunc(msg, cb) {
    msg.eventID = Math.floor(Date.now() + Math.random() * 100)
    eventCb[msg.eventID] = function(err, res) {
      cb(err, res)
    }
    msg.method = _appNamespace + msg.method;
    window.postMessage(JSON.stringify(msg), '*')
  }

  poster.getAccounts = function(cb) {
    callFunc(
      {
        method: 'getAccounts',
      },
      cb
    )
  }

  var _statueandler = null
  var _consolehandler = null

  poster.addTask = function(task, statueandler, cb) {
    _statueandler = statueandler
    callFunc(
      {
        method: 'addTask',
        task: task,
      },
      cb
    )
  }

  poster.magicCall = function(data, cb) {
    callFunc(
      {
        method: 'magicCall',
        methodName: data.methodName,
        data: data,
      },
      cb
    )
  }

  poster.updateDriver = function(data, cb) {
    callFunc(
      {
        method: 'updateDriver',
        data: data,
      },
      cb
    )
  }

  poster.startInspect = function(handler, cb) {
    _consolehandler = handler
    callFunc(
      {
        method: 'startInspect',
      },
      cb
    )
  }

  poster.uploadImage = function(data, cb) {
    callFunc(
      {
        method: 'magicCall',
        methodName: 'uploadImage',
        data: data,
      },
      cb
    )
  }

  window.addEventListener('message', function(evt) {
    try {
      var action = JSON.parse(evt.data)
      if (action.method && action.method === 'taskUpdate') {
        if (_statueandler != null) _statueandler(action.task)
        return
      }

      if (action.method && action.method === 'consoleLog') {
        if (_consolehandler != null) _consolehandler(action.args)
        return
      }
      if (!action.callReturn) return
      if (action.eventID && eventCb[action.eventID]) {
        eventCb[action.eventID](action.result)
        delete eventCb[action.eventID]
      }
    } catch (e) {}
  })

  // window.$poster = poster
  window.$notesearch = poster
}

setTimeout(function() {


  var script = document.createElement('script')
  script.type = 'text/javascript'
  script.innerHTML =
    ';(function() {  ' +
    testFunc.toString() +
    '; ' +
    testFunc.name +
    '("'+_appNamespace+'"); ' +
    ' })();'
  document.head.appendChild(script)
  document.head.removeChild(script)
  console.log('injject')
}, 50)

var allAccounts = []
var accounts = []

function getAccounts(cb) {
  chrome.extension.sendMessage(
    {
      action: 'getAccount',
    },
    function(resp) {
      allAccounts = resp
      cb && cb()
    }
  )
}

if (window.location.href.indexOf('mp.weixin.qq.com') == -1) {
  // getAccounts()
}

function sendToWindow(msg) {
  msg.callReturn = true
  window.postMessage(JSON.stringify(msg), '*')
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponseA) {
  try {
    console.log('revice', request)
    if (request.method == 'taskUpdate') {
      sendToWindow({
        task: request.task,
        method: 'taskUpdate',
      })
    }

    if (request.method == 'consoleLog') {
      sendToWindow({
        args: request.args,
        method: 'consoleLog',
      })
    }
  } catch (e) {
    console.log(e)
  }
})

var _sensitiveAPIWhiteList = [
  'https://www.wechatsync.com',
  'https://developer.wechatsync.com',
  'http://localhost:8080',
]


function callBackground(request, callback) {
  chrome.extension.sendMessage(request, callback)
}


// var _appNamespace = require('./config').config._appNamespace;
function PageCallServer() {
  var _handlers = {};

  function addMethod(action, callback) {
    _handlers[action] = callback
  }

  function executedMethod(request, sender) {
    if(request.method) {
      request.method = request.method.replace(_appNamespace, '')
      var handler = _handlers[request.method]
      console.log('executedMethod', request, handler)
      handler(request, (results) => {
        if(!results.eventID) {
          results.eventID = request.eventID
        }
        sendToWindow(results)
      }, sender)
    }
  }

  //
  function startListenRequest() {
    window.addEventListener('message', function(evt) {
      try {
        var action = JSON.parse(evt.data)
        if (action.method) {
          executedMethod(action, evt)
        }
      } catch(e) {

      }
    })
  }

  return {
    addMethod,
    startListenRequest
  }
}

var pageServer = new PageCallServer();

pageServer.addMethod('magicCall', (action, sendResponse) => {
  callBackground({
    action: 'callDriverMethod',
    methodName: action.methodName,
    data: action.data,
  }, (resp) => {
    sendResponse({
      result: resp,
    })
  })
})


pageServer.addMethod('updateDriver', (action, sendResponse, evt) => {
  if (_sensitiveAPIWhiteList.indexOf(evt.origin) > -1) {
    callBackground({
      action: 'updateDriver',
      data: action.data,
    }, (resp) => {
      sendResponse({
        result: resp,
      })
    })
  } else {
    sendResponse({
      error: 'not support',
    })
  }
})


pageServer.addMethod('startInspect', (action, sendResponse, evt) => {
  if (_sensitiveAPIWhiteList.indexOf(evt.origin) > -1) {
    callBackground({
      action: 'startInspect',
    }, (resp) => {
      sendResponse({
        result: resp,
      })
    })
  } else {
    sendResponse({
      error: 'not support',
    })
  }
})


pageServer.startListenRequest();
