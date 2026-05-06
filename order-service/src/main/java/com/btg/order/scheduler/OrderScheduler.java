package com.btg.order.scheduler;

import com.btg.order.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OrderScheduler {

    private static final Logger log = LoggerFactory.getLogger(OrderScheduler.class);

    private final OrderService orderService;

    public OrderScheduler(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Varre automaticamente ordens PENDING ou FAILED a cada 5 minutos
     * e tenta reprocessá-las — sem nenhuma intervenção humana.
     * Isso reduz o trabalho operacional da mesa de investimentos.
     */
    @Scheduled(cron = "${app.scheduler.pending-orders.cron}")
    public void reprocessPendingOrders() {
        log.info("[SCHEDULER] Iniciando varredura de ordens pendentes...");
        try {
            orderService.reprocessPendingOrders();
        } catch (Exception e) {
            log.error("[SCHEDULER] Erro na varredura: {}", e.getMessage());
        }
        log.info("[SCHEDULER] Varredura concluída.");
    }
}
