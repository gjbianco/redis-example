const PORT = process.env.PORT || 8080
const REDIS_PORT = process.env.REDIS_PORT || 6379
const REDIS_TIMEOUT = process.env.REDIS_TIMEOUT || 5 // seconds

const axios = require('axios')
const bluebird = require('bluebird')
const express = require('express')
const redis = require('redis')

// promisify redis client calls (from redis npm package docs)
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

const app = express()
const redisClient = redis.createClient(REDIS_PORT)

function cache(req, res, next) {
  return redisClient.getAsync(req.query.org)
    .then(data => {
      if (data) {
        console.log('cache hit:', data)
        res.send(data + ' (cached)')
      } else {
        next()
      }
    })
    .catch(next)
}

app.get('/repos', cache, (req, res) => {
  const org = req.query.org
  return axios.get(`https://api.github.com/orgs/${org}/repos`)
    .then(response => (response.data))
    .then(repos => {
      const numRepos = repos.length
      redisClient.setex(org, REDIS_TIMEOUT, numRepos)
      res.send('' + numRepos)
    })
    .catch(() => res.status(500).send('could not get repos'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log('app listening on port', PORT)
})
