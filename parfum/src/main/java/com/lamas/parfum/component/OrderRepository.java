package com.lamas.parfum.component;


import com.lamas.parfum.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Müşterinin tüm siparişlerini en yeniden en eskiye doğru getir
    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);
    // Admin için tüm siparişleri en yeniden en eskiye getir
    List<Order> findAllByOrderByOrderDateDesc();
    Optional<Order> findByOrderCode(String orderCode);
    Optional<Order> findByTrackingNumber(String trackingNumber);
    List<Order> findByStatusIn(List<String> statuses);
}