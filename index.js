const PORT = process.env.PORT || 8080
const REDIS_URL = process.env.REDIS_URL || '//localhost:6379'
const REDIS_TIMEOUT = process.env.REDIS_TIMEOUT || 5 // seconds

const axios = require('axios')
const bluebird = require('bluebird')
const express = require('express')
const fs = require('fs')
const redis = require('redis')

// promisify redis client calls (from redis npm package docs)
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

const app = express()
const redisClient = redis.createClient({
  url: REDIS_URL
})

function cache(req, res, next) {
  return redisClient.getAsync(req.query.org)
    .then(data => {
      if (data) {
        res.send(data + ' (cached)')
      } else {
        next()
      }
    })
    .catch(err => {
      console.log('cache got error:', err)
      next()
    })
}

app.get('/', (req, res) => {
  // res.send('app running. use route <pre>/repos?org=<orgname></pre>')
  res.send(`<pre>${fs.readFileSync('./README.md', 'utf8')}</pre>`)
})

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

app.get('/echo', cache, (req, res) => {
  const org = req.query.org
  redisClient.setex(org, REDIS_TIMEOUT, org)
  return res.send(org)
})

app.get('/kill', (req, res) => {
  process.exit(1)
})

let healthy = true
app.get('/toggle-sick', (req, res) => {
  healthy = !healthy
  res.send('app made ' + healthy ? 'healthy' : 'unhealthy')
})

app.get('/health', (req, res) => {
  if (healthy) {
    res.send('OK')
  } else {
    res.status(500).send('FAIL')
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log('app listening on port', PORT)
})
