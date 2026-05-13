# Corretora Carvalho Investimentos

Sistema de processamento de ordens de investimento com microsserviços, Kafka e automação — desenvolvido para demonstrar habilidades técnicas.

## Arquitetura

```
Cliente
  │
  ▼ POST /api/orders
┌─────────────────┐     publica      ┌─────────────┐
│  order-service  │ ───────────────▶ │    Kafka    │
│    (Java 21)    │                  │ btg.orders  │
│  Spring Boot    │ ◀─────────────── │ btg.orders  │
│  PostgreSQL     │    confirma       │    .dlq     │
└─────────────────┘                  └──────┬──────┘
                                            │ consome
                                     ┌──────▼──────────────┐
                                     │ notification-service │
                                     │     (Node.js)        │
                                     │  processa + confirma │
                                     └─────────────────────┘
```

## Stack

| Serviço | Tecnologia |
|---------|-----------|
| order-service | Java 21 + Spring Boot 3 + PostgreSQL |
| notification-service | Node.js 20 + KafkaJS + Express |
| Mensageria | Apache Kafka + Zookeeper |
| Banco | PostgreSQL 16 |
| CI/CD | GitHub Actions → AWS ECS |

## Funcionalidades de Automação

- **Retry automático** — ordens com falha são reprocessadas automaticamente até 3x
- **Dead Letter Queue (DLQ)** — após 3 falhas, a ordem vai para `btg.orders.dlq` para análise de incidentes sem intervenção humana
- **Scheduler** — job a cada 5 minutos varre ordens PENDING/FAILED e reprocessa automaticamente
- **Health checks** — todos os serviços expõem `/health` para monitoramento
- **Graceful shutdown** — o notification-service desconecta do Kafka corretamente ao encerrar

## Rodar localmente

```bash
docker compose up --build
```

Aguarda todos os serviços ficarem healthy (~1-2 minutos).

## Testar

### Criar uma ordem
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-001",
    "asset": "TESOURO-SELIC-2029",
    "type": "BUY",
    "amount": 10000.00
  }'
```

### Listar ordens
```bash
curl http://localhost:8080/api/orders
```

### Filtrar por status
```bash
curl http://localhost:8080/api/orders/status/CONFIRMED
curl http://localhost:8080/api/orders/status/DEAD
```

### Health checks
```bash
curl http://localhost:8080/actuator/health   # order-service
curl http://localhost:3000/health            # notification-service
```

## Status das ordens

| Status | Descrição |
|--------|-----------|
| PENDING | Criada, aguardando publicação no Kafka |
| PROCESSING | Publicada no Kafka, aguardando confirmação |
| CONFIRMED | Processada com sucesso pelo notification-service |
| FAILED | Falhou — será reprocessada automaticamente |
| DEAD | Falhou 3x — enviada para DLQ para análise |

## Boas práticas aplicadas

- Microsserviços independentes com responsabilidades separadas
- Comunicação assíncrona via Kafka (desacoplamento total)
- Retry com limite + DLQ (padrão de resiliência)
- Health checks em todos os serviços
- Graceful shutdown no Node.js
- Testes unitários com JUnit 5 + Mockito
- CI/CD automatizado com GitHub Actions
- Deploy no AWS ECS
