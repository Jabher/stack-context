const asyncHooks = require('async_hooks')
const eidTidPairs = new Map()
const eidContextMap = new Map()

let enabled = false

const hook = asyncHooks.createHook({
  init (asyncId, type, triggerAsyncId) {
    eidTidPairs.set(asyncId, triggerAsyncId)
  }
})

module.exports = Object.defineProperties(createContext, {
  __eidTidPairs: { get () { return eidTidPairs } },
  __eidContextMap: { get () { return eidContextMap } }
})

function createContext (defaultValue) {
  const context = { provide, consume: () => getContextValue(asyncHooks.executionAsyncId(), context, defaultValue) }

  return context

  function provide (value, fn) {
    if (!enabled) {
      enabled = true
      hook.enable()
    }
    return Promise.resolve()
      .then(() => {
        const asyncId = asyncHooks.executionAsyncId()
        getEidContext(asyncId).set(context, value)
        return fn()
      })
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

function getEidContext (eid) {
  const existingMap = eidContextMap.get(eid)
  if (existingMap) return existingMap
  const newMap = new WeakMap()
  eidContextMap.set(eid, newMap)
  return newMap
}
