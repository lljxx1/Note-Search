function importAll(r) {
  const modules = {}
  r.keys().forEach(key => {
    const module = r(key)
    console.log(module)
    const moduleName = module.default ?  module.default.type : null
    if (moduleName && moduleName !== 'BaseAdapter') {
      modules[module.default.type] = module.default
    }
  })
  return modules
}

export default importAll(require.context('./src', false, /\.js$/))
