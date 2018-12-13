# Stack-context

_Practical application of [async_hooks](https://nodejs.org/api/async_hooks.html) for glory of contexts_

If you are working on

- database ORM/connection suite
- request handler - HTTP, WS, AQMP, Thrift, whatever
- context-based event capturer, like Sentry
- something else with multiple async handlers

you probably encountered the problem. You need to store an object: transaction, connection, some additional variables or what-is-your-problem.
And you need to preserve it through all the calls un _userland_. That's a pain.
You need to control whether they preserve your object, and that's a risk.

But with introduction of `async_hooks` in node.js (since node 8.1) you can relax and allow users to do their stuff, while you are doing yours - magically.

API of `stack-context` is similar to React context, so if you know React contexts, you roughly understand how to use it.

Example of usage:
```javascript
// --- your code
import createContext from 'stack-context'

const transactionContext = createContext()

class DatabaseConnection {
   async transact(fn) {
     await transactionContext.provide(db.createTransaction(this), fn)
   }
   
   query() {
     const transaction = transactionContext.consume()
     return transaction
         ? db.query(...arguments, transaction)
         : db.query(...arguments)       
   }
}
//--- some userland code
import {connection} from './dbConnection'

export async function doStuff() {
  await connection.transact(async () => {
    
  })
}
```
