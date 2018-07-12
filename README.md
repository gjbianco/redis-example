# redis-example

Very simple example of caching with Redis in Node.

Has a singular route that lists number of repos in provided GitHub Organization. e.g.

`<host>/repos?org=ansible`

Looks at `PORT` (default: 8080) for port to bind and `REDIS_URL` for the Redis URL string to connect (default: '//localhost:6379'). Set `REDIS_TIMEOUT` (default: 5 seconds) to set cache value timeout (in seconds).
