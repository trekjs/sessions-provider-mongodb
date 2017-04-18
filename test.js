import test from 'ava'
import MongodbProvider from './'

function sleep (ttl = 1000) {
  return new Promise(resolve => {
    setTimeout(resolve, ttl)
  })
}

test('should create a mongodb client', t => {
  const provider = new MongodbProvider({
    customKey: 233
  })

  t.not(provider.client, undefined)

  provider.quit().then(t.context.done)
})

test('should return undefined', async t => {
  const provider = new MongodbProvider()

  const sess = await provider.get('233')

  t.is(sess, undefined)

  await provider.quit()
})

test('should save a session', async t => {
  const provider = new MongodbProvider()

  await provider.set('233', {
    cookie: {}
  }, 2000)

  const sess = await provider.get('233')

  t.deepEqual(sess, {
    cookie: {}
  })

  await provider.quit()
})

test('should delete a session', async t => {
  const provider = new MongodbProvider()

  await provider.set('233', {
    cookie: {}
  }, 2000)

  let sess = await provider.get('233')

  t.deepEqual(sess, {
    cookie: {}
  })

  await provider.delete('233')

  sess = await provider.get('233')

  t.is(sess, undefined)

  await provider.quit()
})

test('should clear all sessions', async t => {
  const provider = new MongodbProvider()

  await provider.set('233', {
    cookie: {}
  }, 2000)

  await provider.set('377', {
    cookie: {}
  }, 2000)

  await provider.clear('233')

  const sess0 = await provider.get('233')
  const sess1 = await provider.get('377')

  t.is(sess0, undefined)
  t.is(sess1, undefined)

  await provider.quit()
})

test('should throw error when mongodb is already closed', async t => {
  const provider = new MongodbProvider()

  await provider.set('610', 'trek engine', 2000)

  const has = await provider.has('610')

  t.is(has, true)

  await provider.quit()

  const error = await t.throws(provider.get('610'))

  t.true(/opology was destroyed/.test(error.message))
})

test('should automatically delete a session', async t => {
  const provider = new MongodbProvider({
    collectionName: 'sessions2'
  })

  await provider.set('1024', {
    cookie: {}
  }, 1000)

  await sleep(500)

  const sess = await provider.get('1024')

  t.deepEqual(sess, {
    cookie: {}
  })

  await sleep(500)

  const sess2 = await provider.get('1024')

  t.is(sess2, undefined)

  await provider.quit()
})
