package com.btg.order.service;

import com.btg.order.dto.OrderDTO;
import com.btg.order.model.Order;
import com.btg.order.model.OrderStatus;
import com.btg.order.model.OrderType;
import com.btg.order.repository.OrderRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private static final int MAX_RETRIES = 3;

    private final OrderRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topic.orders}")
    private String ordersTopic;

    @Value("${app.kafka.topic.orders-dlq}")
    private String dlqTopic;

    public OrderService(OrderRepository repository,
                        KafkaTemplate<String, String> kafkaTemplate,
                        ObjectMapper objectMapper) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Order create(OrderDTO dto) {
        Order order = new Order();
        order.setClientId(dto.getClientId());
        order.setAsset(dto.getAsset());
        order.setType(dto.getType());
        order.setAmount(dto.getAmount());
        order.setStatus(OrderStatus.PENDING);

        Order saved = repository.save(order);
        log.info("Ordem criada: {} | Cliente: {} | Ativo: {} | Tipo: {} | Valor: {}",
                saved.getId(), saved.getClientId(), saved.getAsset(),
                saved.getType(), saved.getAmount());

        publishToKafka(saved);
        return saved;
    }

    @Transactional
    public void publishToKafka(Order order) {
        try {
            String payload = objectMapper.writeValueAsString(order);
            kafkaTemplate.send(ordersTopic, order.getId(), payload);

            order.setStatus(OrderStatus.PROCESSING);
            repository.save(order);

            log.info("Ordem publicada no Kafka: {}", order.getId());
        } catch (JsonProcessingException e) {
            log.error("Erro ao serializar ordem {}: {}", order.getId(), e.getMessage());
            markAsFailed(order, e.getMessage());
        } catch (Exception e) {
            log.error("Erro ao publicar ordem {} no Kafka: {}", order.getId(), e.getMessage());
            markAsFailed(order, e.getMessage());
        }
    }

    @Transactional
    public void markAsConfirmed(String orderId) {
        repository.findById(orderId).ifPresent(order -> {
            order.setStatus(OrderStatus.CONFIRMED);
            order.setProcessedAt(LocalDateTime.now());
            repository.save(order);
            log.info("Ordem confirmada: {}", orderId);
        });
    }

    @Transactional
    public void markAsFailed(Order order, String errorMessage) {
        order.setRetryCount(order.getRetryCount() + 1);
        order.setErrorMessage(errorMessage);

        if (order.getRetryCount() >= MAX_RETRIES) {
            // Enviou para DLQ — não vai tentar mais
            order.setStatus(OrderStatus.DEAD);
            sendToDlq(order);
            log.warn("Ordem {} enviada para DLQ após {} tentativas", order.getId(), MAX_RETRIES);
        } else {
            order.setStatus(OrderStatus.FAILED);
            log.warn("Ordem {} falhou (tentativa {}/{}). Será reprocessada.",
                    order.getId(), order.getRetryCount(), MAX_RETRIES);
        }
        repository.save(order);
    }

    private void sendToDlq(Order order) {
        try {
            String payload = objectMapper.writeValueAsString(order);
            kafkaTemplate.send(dlqTopic, order.getId(), payload);
        } catch (Exception e) {
            log.error("Erro ao enviar para DLQ: {}", e.getMessage());
        }
    }

    // Chamado pelo scheduler — reprocessa ordens travadas
    @Transactional
    public void reprocessPendingOrders() {
        List<Order> stuckOrders = repository.findByStatusInAndCreatedAtBefore(
                List.of(OrderStatus.PENDING, OrderStatus.FAILED),
                LocalDateTime.now().minusMinutes(1)
        );

        if (stuckOrders.isEmpty()) {
            log.debug("Nenhuma ordem pendente para reprocessar.");
            return;
        }

        log.info("Reprocessando {} ordens pendentes/falhas...", stuckOrders.size());
        stuckOrders.forEach(this::publishToKafka);
    }

    @Transactional(readOnly = true)
    public List<Order> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Order> findByClient(String clientId) {
        return repository.findByClientId(clientId);
    }

    @Transactional(readOnly = true)
    public List<Order> findByStatus(OrderStatus status) {
        return repository.findByStatus(status);
    }
}
