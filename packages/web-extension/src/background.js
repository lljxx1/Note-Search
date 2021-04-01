
// require("./providers/driverCodePack");
import { initializeDriver, getDriverProvider, initDevRuntimeEnvironment } from '@/runtime'

var serviceFactory = require('./providers/factory')
// window.currentDriver = localDriver
initDevRuntimeEnvironment();
// index by tabId
var logWatchers = {}
var isStarted = false;

function startDebugPush() {
  console.log('startDebugPush')
  if(isStarted) return
  isStarted = true;
  var rawLogFun = console.log
  console.log = function () {
    rawLogFun.apply(null, arguments)
    try {
      var args = [].slice.apply(arguments)
      brodcastToWatcher(args)
    } catch (e){
      console.log('brodcastToWatcher.error', e);
    }
  }

  function brodcastToWatcher(args) {
    var tabIds = Object.keys(logWatchers)
    for (let index = 0; index < tabIds.length; index++) {
      const logWatcher = logWatchers[tabIds[index]];
      chrome.tabs.sendMessage(
        logWatcher.tab.id,
        { method: 'consoleLog', args: args },
        function (response) {}
      )
    }
  }
}



var service = analytics.getService('syncer')
var tracker = service.getTracker('UA-48134052-13')


function Server() {
  var _handlers = {};
  var _appNamespace = require('./config').config._appNamespace;

  function addMethod(action, callback) {
    _handlers[action] = callback
  }

  function executedMethod(request, sender, sendResponse) {
    console.log('executedMethod', request)
    if(request.action) {
      request.action = request.action.replace(_appNamespace, '')
      var handler = _handlers[request.action]
      handler(request, sendResponse, sender)
    }
  }

  addMethod('getCache', (request, sendResponse) => {
    chrome.storage.local.get(request.names ? request.names : [request.name], function(
      result
    ) {
      sendResponse({
        result: result,
      })
    })
  });

  addMethod('setCache', (request, sendResponse) => {
    var d = {}
    d[request.name] = request.value
    chrome.storage.local.set(d, function() {
      console.log('cache set')
    })
  });


  addMethod('sendEvent', (request, sendResponse) => {
    try {
      var event = request.event
      tracker.sendEvent(event.category, event.action, event.label)
    } catch (e) {}
  });


  addMethod('startInspect', (request, sendResponse, sender) => {
    logWatchers[sender.tab.id] = sender
    startDebugPush();
  });

  addMethod('updateDriver', (request, sendResponse, sender) => {
    (async () => {
      try {
        var isDevelopment = request.data.dev;
        var isPatch = request.data.patch;
        var patchName = request.data.name;
        // var patchName = request.name;
        if (isPatch && isDevelopment) {
          console.log('try patch driver')
          try {
            var patchCodeVm = getDriverProvider(request.data.code)
            if(patchCodeVm.provider) {
              serviceFactory.addService(patchName, patchCodeVm.provider)
              console.log('custom driver seted')
              sendResponse({
                result: {
                  status: 1
                },
              })
            } else {
              sendResponse({
                result: {
                  error: 'exports.provider not found',
                  status: 0
                },
              })
            }
            console.log('newDriver.isPatch', patchCodeVm)
          } catch (e) {
            sendResponse({
              result: {
                error: 'initvm failed',
                detail: e.toString(),
                status: 0
              },
            })
            console.log('initvm failed', e)
          }

        }

        if (!isPatch) {
          var newDriver = getDriverProvider(request.data.code)
          var newDriverMeta = newDriver.getMeta()
          console.log('new version found', newDriverMeta)
          if (isDevelopment) {
            setDriver(newDriver)
            // dynamic reload not store
          } else {
            chrome.storage.local.set(
              {
                driver: request.data.code,
              },
              function() {
                console.log('driver seted')
                loadDriver()
              }
            )
            console.log('is new driver')
            sendResponse({
              result: {
                status: 1
              },
            })
          }
        }
      } catch (e) {
        sendResponse({
          result: {
            status: 0,
            error: e.toString()
          },
        })
      }

    })()
  });


  addMethod('callDriverMethod', (request, sendResponse, sender) => {
    ;(async () => {
      try {
        var driver = serviceFactory.getService(request.data.account )
        var methodName = request.methodName
        var driverFunc = driver[methodName]
        if(!driverFunc) {
          sendResponse({
            error: 'method not exists',
          })
        } else {
          var callResult = await driver[methodName](request.data.args)
          sendResponse({
            result: callResult,
          })
        }
      } catch (e) {
        sendResponse({
          error: e.toString(),
        })
      }
    })()
  });

  function startListenRequest() {
    chrome.runtime.onMessage.addListener(function(
      request,
      sender,
      sendResponse
    ) {
      try {
        executedMethod(request, sender, sendResponse)
      } catch (e) {}
      return true
    })
  }

  return {
    addMethod,
    startListenRequest
  }
}

new Server().startListenRequest();


// serviceFactory.callAllServiceMethod('search', [{
//   keyword: 'test'
// }])
