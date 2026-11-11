package com.lamas.parfum;

import com.lamas.parfum.component.CartItemRepository;
import com.lamas.parfum.component.OrderRepository;
import com.lamas.parfum.controller.OrderController;
import com.lamas.parfum.model.Order;
import com.lamas.parfum.repository.ProductRepository;
import com.lamas.parfum.service.EmailService;
import com.lamas.parfum.service.YurticiKargoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderControllerTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private ProductRepository productRepository;

    @Mock private YurticiKargoService yurticiKargoService;
    @Mock private EmailService emailService;

    private OrderController orderController;

    private Order sampleOrder;

    @BeforeEach
    void setUp() {

        orderController = new OrderController(orderRepository, cartItemRepository, productRepository);


        ReflectionTestUtils.setField(orderController, "yurticiKargoService", yurticiKargoService);
        ReflectionTestUtils.setField(orderController, "emailService", emailService);

        // Sanal siparişimiz
        sampleOrder = new Order();
        sampleOrder.setId(500L);
        sampleOrder.setOrderCode("LMS-98765");
        sampleOrder.setCustomerName("Ahmet Yılmaz");
        sampleOrder.setContactEmail("ahmet@mail.com");
        sampleOrder.setStatus("Sipariş Alındı");
        sampleOrder.setTrackingNumber(null);
    }

    @Test
    void updateOrderStatus_WhenStatusIsHazirlaniyorAndTrackingNull_ShouldCreateKargoAndSendEmail() {
        when(orderRepository.findById(500L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(sampleOrder);

        //Sipariş durumunu "Hazırlanıyor" olarak güncelle
        ResponseEntity<?> response = orderController.updateOrderStatus(500L, "Hazırlanıyor");

        // Doğrulamalar
        assertEquals(200, response.getStatusCode().value());
        assertEquals("Hazırlanıyor", sampleOrder.getStatus());
        assertEquals("LMS-98765", sampleOrder.getTrackingNumber());


        verify(yurticiKargoService, times(1)).kargoGonderisiOlustur(sampleOrder);
        verify(emailService, times(1)).siparisDurumMailiGonder(
                eq("ahmet@mail.com"), eq("Ahmet Yılmaz"), eq("LMS-98765"), eq("Hazırlanıyor"));
    }

    @Test
    void updateOrderStatus_WhenStatusIsKargoyaVerildi_ShouldNotCallKargoServiceAgain() {
        // Zaten takip numarası atanmış bir sipariş
        sampleOrder.setTrackingNumber("LMS-98765");
        when(orderRepository.findById(500L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(sampleOrder);

        ResponseEntity<?> response = orderController.updateOrderStatus(500L, "Kargoya Verildi");

        assertEquals(200, response.getStatusCode().value());
        assertEquals("Kargoya Verildi", sampleOrder.getStatus());

        // Kargo servisi bir daha çağrılmamalı (null ve Hazırlanıyor değil çünkü)
        verify(yurticiKargoService, never()).kargoGonderisiOlustur(any(Order.class));

        // E-posta gönderilmiş olmalı
        verify(emailService, times(1)).siparisDurumMailiGonder(
                eq("ahmet@mail.com"), eq("Ahmet Yılmaz"), eq("LMS-98765"), eq("Kargoya Verildi"));
    }
}