import test from 'ava'
import createContext from './index'
import fs from 'fs-extra'
import path from 'path'

test('default', async t => {
  const obj = {}
  const context = createContext(obj)
  t.truthy(obj === context.consume())
  t.pass()
})

test('plain', async t => {
  const obj = {}
  const context = createContext()
  context.provide(obj, () => {
    t.truthy(obj === context.consume())
    t.pass()
  })
})

test('async', async t => {
  const obj = {}
  const context = createContext()
  await context.provide(obj, async () => {
    await new Promise(res => process.nextTick(res))
    t.truthy(obj === context.consume())
    t.pass()
  })
})

test('async extern', async t => {
  const obj = {}
  const context = createContext()
  const extern = () => {
    t.truthy(obj === context.consume())
    t.pass()
  }

  await context.provide(obj, async () => {
    await new Promise(res => process.nextTick(res))
    extern()
  })
})

test('async nested extern', t =>
  new Promise(res => {
    const obj = {}
    const context = createContext()
    const extern = () => {
      t.truthy(obj === context.consume())
      t.pass()
      res()
    }

    context.provide(obj, () => {
      fs.readFile(path.resolve(__dirname, __filename)).then(() => {
        setTimeout(() => process.nextTick(extern))
      })
    })
  })
)

test('throw extern', t =>
  new Promise(res => {
    const obj = {}
    const context = createContext()
    const extern = () => {
      t.truthy(obj === context.consume())
      t.pass()
      res()
    }

    context.provide(obj, () => {
      Promise.reject('test').catch(extern)
    })
  })
)

test('nested context', t =>
  new Promise(res => {
    const obj = { iteration: 1 }
    const obj2 = { iteration: 2 }
    const context = createContext()

    const extern = () => {
      t.truthy(obj2 === context.consume())
      t.pass()
      res()
    }

    context.provide(obj, () => {
      context.provide(obj2, () => {
        process.nextTick(extern)
      })
    })
  })
)

test('multi-context', t =>
  new Promise(res => {
    const obj = { iteration: 1 }
    const obj2 = { iteration: 2 }
    const context = createContext()
    const context2 = createContext()

    const extern = () => {
      t.truthy(obj === context.consume())
      t.truthy(obj2 === context2.consume())
      t.pass()
      res()
    }

    context.provide(obj, () => {
      context2.provide(obj2, () => {
        process.nextTick(extern)
      })
    })
  })
)

// this is for dirty implementation
// we're just counting contexts and cleanup everything && disable hook when last one is closed
test.skip('GC: should stop & cleanup after last context closed', async t => {
  const context = createContext()
  await context.provide({}, async () => {
    await new Promise(res => process.nextTick(res))
    await context.provide({}, async () => {
      await new Promise(res => process.nextTick(res))
    })
  })
  t.truthy(createContext.__eidTidPairs.size === 0)
  t.truthy(createContext.__eidContextMap.size === 0)
})

// todo
test.skip('GC: should keep original size when one of contexts is closed', async t => {
  const context = createContext()
  await context.provide({}, async () => {
    await new Promise(res => process.nextTick(res))
    const eidTidPairsSizeSnapshot = createContext.__eidTidPairs.size
    const eidContextMapSizeSnapshot = createContext.__eidContextMap.size
    await context.provide({}, async () => {
      await new Promise(res => {
        process.nextTick(res)
      })
    })
    t.truthy(eidTidPairsSizeSnapshot === createContext.__eidTidPairs.size)
    t.truthy(eidContextMapSizeSnapshot === createContext.__eidContextMap.size)
  })
})
