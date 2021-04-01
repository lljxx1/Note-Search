import buildInProviders from "@note-search/providers";

const _customService = {};

export function addService(name, serviceMeta) {
  _customService[name] = {
    name: name,
    meta: serviceMeta
  }
  console.log('addService', _customService)
}

export function getService(account) {
  if(_customService[account.type]) {
    const custom = _customService[account.type]
    console.log('custom', custom)
    return new custom['meta']['service'](account)
  }

  if (buildInProviders[account.type]) {
    return new buildInProviders[account.type]['service'](account)
  }
  throw Error('not support service type')
}

export function getServiceDefinition(account) {
  if(_customService[account.type]) {
    const custom = _customService[account.type]
    return custom['meta']
  }

  if (buildInProviders[account.type]) {
    return buildInProviders[account.type]
  }
  throw Error('not support service type')
}

export function search(info, type = 'all') {

}

const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
  arr.slice(i * size, i * size + size)
);


export function getAllServiceTypes() {
  return Object.keys(buildInProviders).concat(Object.keys(_customService))
}


export function getAllService() {
  return Object.keys(buildInProviders).concat(Object.keys(_customService)).map(type => {
    return getServiceDefinition({ type })
  })
}

function isPromise(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

export async function callAllServiceMethod(method, args, specifyTypes = null) {
  const allServiceTypes = getAllServiceTypes()
  const stepItems = chunk(allServiceTypes, 20);
  const startTime = Date.now()
  let callResults = []
  for (let index = 0; index < stepItems.length; index++) {
    try {
      const stepItem = stepItems[index];
      const results = await Promise.all(
        stepItem.map((type) => {
          const serviceInstance = getService({ type })
          const serviceDefinition = getServiceDefinition({ type })
          return new Promise((resolve, reject) => {
            const returnResult = serviceInstance[method].apply(serviceInstance, args)
            console.log('returnResult', returnResult)
            if (isPromise(returnResult)) {
              returnResult.then((res) => {
                resolve({
                  meta: serviceDefinition.meta,
                  serviceType: type,
                  result: res,
                })
              }, function() {
                resolve(null)
              })
            } else {
              resolve(returnResult)
            }
          })
        })
      );
      const bulkCallResults = results.filter(_ => _)
      callResults = callResults.concat(bulkCallResults)
    } catch (e) {
      console.log("chunkPromise", e);
    }
  }
  console.log(allServiceTypes, callResults)
  return callResults
}


export function getMeta() {
  return {
    version: '0.0.1',
    versionNumber: 1
  }
}
