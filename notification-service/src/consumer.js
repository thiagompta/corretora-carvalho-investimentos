const { Kafka } = require('kafkajs')
const axios = require('axios')
const logger = require('./logger')

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
  retry: {
    initialRetryTime: 1000,
    retries: 5,
  },
})

const consumer = kafka.consumer({ groupId: 'notification-group' })

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:8080'
const TOPIC = process.env.KAFKA_TOPIC || 'btg.orders'
const DLQ_TOPIC = process.env.KAFKA_DLQ_TOPIC || 'btg.orders.dlq'

// Simula o processamento da ordem (validação, envio de e-mail, etc.)
async function processOrder(order) {
  logger.info(`Processando ordem: ${order.id} | Cliente: ${order.clientId} | Ativo: ${order.asset} | Tipo: ${order.type} | Valor: R$ ${order.amount}`)

  // Simula tempo de processamento (ex: consulta a sistema externo)
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Confirma a ordem no order-service via webhook
  await axios.post(`${ORDER_SERVICE_URL}/api/orders/${order.id}/confirm`)
  logger.info(`Ordem confirmada com sucesso: ${order.id}`)
}

async function startConsumer() {
  await consumer.connect()
  logger.info('Notification Service conectado ao Kafka')

  await consumer.subscribe({ topic: TOPIC, fromBeginning: false })
  await consumer.subscribe({ topic: DLQ_TOPIC, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawValue = message.value?.toString()
      if (!rawValue) return

      let order
      try {
        order = JSON.parse(rawValue)
      } catch (e) {
        logger.error(`Mensagem inválida recebida: ${rawValue}`)
        return
      }

      if (topic === DLQ_TOPIC) {
        // Ordens na DLQ — apenas loga para análise de incidentes
        logger.warn(`[DLQ] Ordem morta recebida para análise: ${order.id} | Erro: ${order.errorMessage}`)
        return
      }

      try {
        await processOrder(order)
      } catch (err) {
        logger.error(`Erro ao processar ordem ${order.id}: ${err.message}`)
        // O order-service vai reprocessar via scheduler — não precisamos fazer nada aqui
      }
    },
  })
}

async function stopConsumer() {
  await consumer.disconnect()
  logger.info('Notification Service desconectado do Kafka')
}

module.exports = { startConsumer, stopConsumer }
