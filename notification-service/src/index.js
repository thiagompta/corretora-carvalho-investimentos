const express = require('express')
const { startConsumer, stopConsumer } = require('./consumer')
const logger = require('./logger')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
  })
})

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    name: 'BTG Notification Service',
    version: '1.0.0',
    description: 'Consome ordens do Kafka e processa notificações',
    kafka: {
      broker: process.env.KAFKA_BROKER || 'kafka:9092',
      topic: process.env.KAFKA_TOPIC || 'btg.orders',
      dlqTopic: process.env.KAFKA_DLQ_TOPIC || 'btg.orders.dlq',
    },
  })
})

// Inicia o servidor HTTP
app.listen(PORT, () => {
  logger.info(`Notification Service HTTP rodando na porta ${PORT}`)
})

// Inicia o consumer Kafka
startConsumer().catch((err) => {
  logger.error(`Erro ao iniciar consumer: ${err.message}`)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Encerrando notification-service...')
  await stopConsumer()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('Encerrando notification-service...')
  await stopConsumer()
  process.exit(0)
})
