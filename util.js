const asyncHooks = require('async_hooks')
const eidTidPairs = new Map()
const eidContextMap = new Map()

function getEidContext (eid) {
  const existingMap = eidContextMap.get(eid)
  if (existingMap) {
    return existingMap
  } else {
    const newMap = new WeakMap()
    eidContextMap.set(eid, newMap)
    return newMap
  }
}

function getContextValue (initialId, context, defaultValue) {
  let triggerId = initialId
  while (triggerId) {
    const contextMap = eidContextMap.get(triggerId)
    if (contextMap) {
      if (contextMap.has(context)) {
        return contextMap.get(context)
      }
    }
    triggerId = eidTidPairs.get(triggerId)
  }
  return defaultValue
}

module.exports = {
  asyncHooks,
  eidTidPairs,
  eidContextMap,
  getEidContext,
  getContextValue,
  hook
}
