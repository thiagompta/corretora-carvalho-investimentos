package com.btg.order.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Value("${app.kafka.topic.orders}")
    private String ordersTopic;

    @Value("${app.kafka.topic.orders-dlq}")
    private String ordersDlqTopic;

    // Cria os tópicos automaticamente se não existirem
    @Bean
    public NewTopic ordersTopic() {
        return TopicBuilder.name(ordersTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic ordersDlqTopic() {
        return TopicBuilder.name(ordersDlqTopic)
                .partitions(1)
                .replicas(1)
                .build();
    }
}
