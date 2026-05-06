package com.btg.order.dto;

import com.btg.order.model.OrderType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class OrderDTO {

    @NotBlank(message = "clientId é obrigatório")
    private String clientId;

    @NotBlank(message = "asset é obrigatório")
    private String asset;

    @NotNull(message = "type é obrigatório (BUY ou SELL)")
    private OrderType type;

    @NotNull(message = "amount é obrigatório")
    @DecimalMin(value = "0.01", message = "Valor mínimo é R$ 0,01")
    private BigDecimal amount;

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getAsset() { return asset; }
    public void setAsset(String asset) { this.asset = asset; }

    public OrderType getType() { return type; }
    public void setType(OrderType type) { this.type = type; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
