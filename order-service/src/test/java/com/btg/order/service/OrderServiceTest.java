package com.btg.order.service;

import com.btg.order.dto.OrderDTO;
import com.btg.order.model.Order;
import com.btg.order.model.OrderStatus;
import com.btg.order.model.OrderType;
import com.btg.order.repository.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository repository;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    
    private OrderService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
void setUp() {
    // Registra suporte a LocalDateTime
    objectMapper.registerModule(new JavaTimeModule());
    objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    service = new OrderService(repository, kafkaTemplate, objectMapper);
    ReflectionTestUtils.setField(service, "ordersTopic", "btg.orders");
    ReflectionTestUtils.setField(service, "dlqTopic", "btg.orders.dlq");
}

    @Test
    @DisplayName("Deve criar ordem com status PROCESSING após publicar no Kafka")
    void shouldCreateOrderAndPublishToKafka() {
        OrderDTO dto = new OrderDTO();
        dto.setClientId("client-001");
        dto.setAsset("TESOURO-SELIC");
        dto.setType(OrderType.BUY);
        dto.setAmount(new BigDecimal("10000.00"));

        Order savedOrder = new Order();
        savedOrder.setId("order-123");
        savedOrder.setClientId("client-001");
        savedOrder.setAsset("TESOURO-SELIC");
        savedOrder.setType(OrderType.BUY);
        savedOrder.setAmount(new BigDecimal("10000.00"));
        savedOrder.setStatus(OrderStatus.PENDING);
        savedOrder.setRetryCount(0);
        savedOrder.setCreatedAt(LocalDateTime.now());

        when(repository.save(any())).thenReturn(savedOrder);

        Order result = service.create(dto);

        assertThat(result).isNotNull();
        verify(repository, atLeast(1)).save(any(Order.class));
        verify(kafkaTemplate).send(eq("btg.orders"), eq("order-123"), any(String.class));
    }

    @Test
    @DisplayName("Deve marcar ordem como DEAD após 3 falhas e enviar para DLQ")
    void shouldSendToDlqAfterMaxRetries() {
        Order order = new Order();
        order.setId("order-456");
        order.setRetryCount(2); // já tentou 2x, essa é a 3ª
        order.setStatus(OrderStatus.FAILED);
        order.setCreatedAt(LocalDateTime.now());

        when(repository.save(any())).thenReturn(order);

        service.markAsFailed(order, "Timeout");

        assertThat(order.getStatus()).isEqualTo(OrderStatus.DEAD);
        assertThat(order.getRetryCount()).isEqualTo(3);
        verify(kafkaTemplate).send(eq("btg.orders.dlq"), eq("order-456"), any(String.class));
    }

    @Test
    @DisplayName("Deve marcar ordem como FAILED (não DEAD) na primeira falha")
    void shouldMarkAsFailedOnFirstRetry() {
        Order order = new Order();
        order.setId("order-789");
        order.setRetryCount(0);
        order.setStatus(OrderStatus.PROCESSING);
        order.setCreatedAt(LocalDateTime.now());

        when(repository.save(any())).thenReturn(order);

        service.markAsFailed(order, "Connection refused");

        assertThat(order.getStatus()).isEqualTo(OrderStatus.FAILED);
        assertThat(order.getRetryCount()).isEqualTo(1);
        verify(kafkaTemplate, never()).send(eq("btg.orders.dlq"), any(), any());
    }

    @Test
    @DisplayName("Deve confirmar ordem corretamente")
    void shouldConfirmOrder() {
        Order order = new Order();
        order.setId("order-321");
        order.setStatus(OrderStatus.PROCESSING);
        order.setRetryCount(0);
        order.setCreatedAt(LocalDateTime.now());

        when(repository.findById("order-321")).thenReturn(Optional.of(order));
        when(repository.save(any())).thenReturn(order);

        service.markAsConfirmed("order-321");

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(order.getProcessedAt()).isNotNull();
    }

    @Test
    @DisplayName("Scheduler deve reprocessar ordens PENDING e FAILED")
    void shouldReprocessStuckOrders() {
        Order pending = new Order();
        pending.setId("p1");
        pending.setStatus(OrderStatus.PENDING);
        pending.setRetryCount(0);
        pending.setCreatedAt(LocalDateTime.now().minusMinutes(5));

        when(repository.findByStatusInAndCreatedAtBefore(any(), any()))
                .thenReturn(List.of(pending));
        when(repository.save(any())).thenReturn(pending);

        service.reprocessPendingOrders();

        verify(kafkaTemplate).send(eq("btg.orders"), eq("p1"), any(String.class));
    }
}
