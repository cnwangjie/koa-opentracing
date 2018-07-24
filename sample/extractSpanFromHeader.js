const Koa = require('koa')
const app = new Koa()

const koaOpentracing = require('../src/index')
koaOpentracing(app, {
  appname: 'test',
  http: true,
  logger: [
    {log: console.log}
  ],
  carrier: {
    CustomHeaderCarrier: class CustomHeaderCarrier {
      inject(spanContext) {
        return {'x-request-id': spanContext.traceId + spanContext.spanId}
      }

      extract(header) {
        const traceId = header['x-request-id'].substr(0, 32)
        const spanId = header['x-request-id'].substr(32)
        return {traceId, spanId}
      }
    }
  }
})
app.use(async ctx => {
  const spanContext = ctx.tracer.extract('CustomHeaderCarrier', ctx.header)
  const span = ctx.tracer.startSpan('t', {
    childOf: spanContext
  })
  await new Promise(r => setTimeout(r, 1000))
  span.finish()
})
app.listen('4010')