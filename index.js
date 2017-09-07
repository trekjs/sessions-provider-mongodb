/*!
 * sessions-provider-mongodb
 * Copyright(c) 2017 Fangdun Cai <cfddream@gmail.com> (https://fundon.me)
 * MIT Licensed
 */

'use strict'

const Emitter = require('events')
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
  constructor(options = {}) {
    Object.keys(options).forEach(k => {
      if (!(k in defaults)) delete options[k]
    })
    Object.assign(this, defaults, options)
    this.client = new Emitter()
    this.connect()
  }

  connect() {
    return MongoClient.connect(this.uri, this.options).then(db => {
      this.client.emit('connect', (this[DB] = db))
      return db
        .collection(this.collectionName)
        .ensureIndex({ expires: 1 }, { expireAfterSeconds: 3600 })
        .then(() => db)
    })
  }

  get db() {
    return this[DB] ? Promise.resolve(this[DB]) : this.connect()
  }

  get collection() {
    return this.db.then(db => db.collection(this.collectionName))
  }

  async clear() {
    return (await this.collection).remove({})
  }

  async get(_id) {
    const d = await (await this.collection).findOne({ _id })

    if (d) {
      const { session, expires } = d

      // See: https://docs.mongodb.com/manual/tutorial/expire-data/
      if (expires <= Date.now()) {
        await this.delete(_id)
        return
      }

      return session
    }
  }

  async has(_id) {
    return Boolean(await this.get(_id))
  }

  async set(_id, session, expires = 0) {
    return (await this.collection).update(
      { _id },
      { session, expires: new Date(Date.now() + expires) },
      { upsert: true }
    )
  }

  async delete(_id) {
    return (await this.collection).remove({ _id })
  }

  quit() {
    return this.db.then(db => {
      db.close()
      this.client.emit('close')
    })
  }
}
