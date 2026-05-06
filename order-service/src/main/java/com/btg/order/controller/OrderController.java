package com.btg.order.controller;

import com.btg.order.dto.OrderDTO;
import com.btg.order.model.Order;
import com.btg.order.model.OrderStatus;
import com.btg.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    // POST /api/orders — cria nova ordem e publica no Kafka
    @PostMapping
    public ResponseEntity<Order> create(@RequestBody @Valid OrderDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    // GET /api/orders — lista todas as ordens
    @GetMapping
    public ResponseEntity<List<Order>> listAll() {
        return ResponseEntity.ok(service.findAll());
    }

    // GET /api/orders/client/{clientId}
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<Order>> byClient(@PathVariable String clientId) {
        return ResponseEntity.ok(service.findByClient(clientId));
    }

    // GET /api/orders/status/{status}
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Order>> byStatus(@PathVariable OrderStatus status) {
        return ResponseEntity.ok(service.findByStatus(status));
    }

    // POST /api/orders/{id}/confirm — chamado pelo notification-service via webhook
    @PostMapping("/{id}/confirm")
    public ResponseEntity<Void> confirm(@PathVariable String id) {
        service.markAsConfirmed(id);
        return ResponseEntity.ok().build();
    }
}
