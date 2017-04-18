/*!
 * sessions-provider-mongodb
 * Copyright(c) 2017 Fangdun Cai <cfddream@gmail.com> (https://fundon.me)
 * MIT Licensed
 */

'use strict'

const { MongoClient } = require('mongodb')

const defaults = {
  // Mongodb server uri
  uri: 'mongodb://localhost:27017/test',
  // Mongodb collection name
  collectionName: 'sessions',
  // Mongodb client options
  options: undefined
}

const DB = Symbol('MongodbProvider#db')

module.exports = class MongodbProvider {

  constructor (options = {}) {
    Object.keys(options).forEach(k => {
      if (!(k in defaults)) delete options[k]
    })
    Object.assign(this, defaults, options)
  }

  get client () {
    return MongoClient.connect(this.uri, this.options)
  }

  get db () {
    if (!this[DB]) {
      return this.client.then(db => {
        this[DB] = db
        return db
          .collection(this.collectionName)
          .ensureIndex({ expires: 1 }, { expireAfterSeconds: 3600 })
          .then(() => db)
      })
    }
    return Promise.resolve(this[DB])
  }

  get collection () {
    return this.db.then(db => db.collection(this.collectionName))
  }

  async clear () {
    return (await this.collection).remove({})
  }

  async get (sid) {
    const d = await (await this.collection).findOne({ _id: sid })

    if (d) {
      const { session, expires } = d

      // See: https://docs.mongodb.com/manual/tutorial/expire-data/
      if (expires < Date.now()) {
        await this.delete(sid)
        return
      }

      return session
    }
  }

  async has (sid) {
    return Boolean(await this.get(sid))
  }

  async set (sid, session, expires = 0) {
    return (await this.collection).update(
      { _id: sid },
      { session, expires: new Date(Date.now() + expires) },
      { upsert: true }
    )
  }

  async delete (sid) {
    return (await this.collection).remove({ _id: sid })
  }

  quit () {
    return this.db.then(db => db.close())
  }

}
