package com.btg.order.repository;

import com.btg.order.model.Order;
import com.btg.order.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByClientId(String clientId);

    // Busca ordens pendentes ou com falha criadas há mais de 1 minuto (para o scheduler)
    List<Order> findByStatusInAndCreatedAtBefore(
            List<OrderStatus> statuses,
            LocalDateTime before
    );
}
