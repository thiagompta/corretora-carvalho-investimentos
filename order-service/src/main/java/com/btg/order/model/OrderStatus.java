package com.btg.order.model;

public enum OrderStatus {
    PENDING,      // Aguardando processamento
    PROCESSING,   // Publicado no Kafka, aguardando confirmação
    CONFIRMED,    // Processado com sucesso
    FAILED,       // Falhou — será reprocessado
    DEAD          // Falhou 3x — foi para DLQ
}
