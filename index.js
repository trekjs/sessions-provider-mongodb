'use strict'

const mongodb = require('mongodb')

const defaults = {}

module.exports = class MongodbProvider {

  constructor (options) {
  }

  async clear () {}

  async get (sid) {}

  async set (ssid, sess, expires) {}

  async delete (sid) {}

}
