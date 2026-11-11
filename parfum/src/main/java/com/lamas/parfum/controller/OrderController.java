package com.lamas.parfum.controller;



import com.lamas.parfum.component.CartItemRepository;
import com.lamas.parfum.component.OrderRepository;
import com.lamas.parfum.component.UserRepository;
import com.lamas.parfum.model.Order;
import com.lamas.parfum.repository.ProductRepository;
import com.lamas.parfum.service.EmailService;
import com.lamas.parfum.service.KuveytTurkService;
import com.lamas.parfum.service.PaymentService;
import com.lamas.parfum.service.YurticiKargoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;



    @Autowired
    private PaymentService paymentService;

     @Autowired
     private YurticiKargoService yurticiKargoService;

    @Autowired
    private KuveytTurkService kuveytTurkService;

    public OrderController(OrderRepository orderRepository, CartItemRepository cartItemRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createOrder(@RequestBody Order order) {
        order.setOrderDate(LocalDateTime.now());

        // Sipariş henüz ödenmediği için durumu "Ödeme Bekliyor" yapıyoruz
        order.setStatus("Ödeme Bekliyor");

        // GÜVENLİK AĞI: Frontend boş yollarsa veritabanından zorla al
        if ((order.getContactEmail() == null || order.getContactEmail().isEmpty()) && order.getUserId() != null) {
            userRepository.findById(order.getUserId()).ifPresent(user -> {
                order.setContactEmail(user.getEmail());
            });
        }


        // 🌟 1. KRİTİK DEĞİŞİKLİK: Siparişi kaydediyoruz ama SEPETİ TEMİZLEMİYORUZ ve STOK DÜŞMÜYORUZ!
        // Ödeme onaylandığında bu işlemleri Callback sınıfı yapacak.
        Order savedOrder = orderRepository.save(order);

        // --- İYZİCO ÖDEME EKRANINI OLUŞTUR ---
        String iyzicoFormHtml = paymentService.odemeEkraniOlustur(savedOrder);

        Map<String, Object> response = new HashMap<>();

        if (iyzicoFormHtml != null && !iyzicoFormHtml.isEmpty()) {
            response.put("status", "success");
            response.put("iyzicoForm", iyzicoFormHtml);
        } else {
            response.put("status", "error");
            response.put("message", "Ödeme ekranı oluşturulamadı.");
        }

        return ResponseEntity.ok(response);
    }
    // 2. Müşterinin Tüm Siparişlerini Getir
    @GetMapping("/user/{userId}")
    public List<Order> getUserOrders(@PathVariable Long userId) {
        return orderRepository.findByUserIdOrderByOrderDateDesc(userId);
    }

    // --- ADMİN PANELİ İÇİN METOTLAR ---

    // 3. Admin: Tüm Siparişleri Getir
    @GetMapping("/all")
    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc();
    }

    // Sınıfın en üstüne servisi enjekte etmeyi unutma:


    @PutMapping("/update-status/{id}")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Sipariş bulunamadı"));
        order.setStatus(status);

        // 🌟 SİPARİŞ HAZIRLANIYOR'A ÇEKİLDİĞİNDE OTOMATİK YURTİÇİ KAYDINI AÇ
        if ("Hazırlanıyor".equals(status) && order.getTrackingNumber() == null) {
            String referansKodu = order.getOrderCode() != null ? order.getOrderCode() : String.valueOf(order.getId());
            order.setTrackingNumber(referansKodu);

            // Arkada sessizce Yurtiçi Kargo'ya bağlanıp paketi sisteme kaydeder
            yurticiKargoService.kargoGonderisiOlustur(order);
        }

        orderRepository.save(order);
        emailService.siparisDurumMailiGonder(
                order.getContactEmail(),
                order.getCustomerName(),
                String.valueOf(order.getOrderCode()),
                status
        );
        return ResponseEntity.ok(order);
    }

    // PATRON EKRANI İÇİN: Tüm Siparişleri Liste Olarak Gönderir
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrdersList() {
        // Eğer sende List kullanırken hata verirse, dosyanın en üstüne import java.util.List; eklemeyi unutma.
        return ResponseEntity.ok(orderRepository.findAll());
    }
    @PostMapping("/refund/{id}")
    public ResponseEntity<?> iadeIslemiBaslat(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Sipariş bulunamadı"));

        String siparisNo = String.valueOf(order.getId());
        String provizyonNo = order.getProvisionNumber();

        // 🌟 İŞTE EKSİK OLAN TANIM BURASI:
        boolean ayniGunMu = order.getOrderDate() != null &&
                order.getOrderDate().toLocalDate().isEqual(java.time.LocalDate.now());

        if (!ayniGunMu && (provizyonNo == null || provizyonNo.isEmpty() || "000000".equals(provizyonNo))) {
            return ResponseEntity.status(400).body("Bu eski bir sipariş olduğu için iade şifresi sistemde yok. Lütfen Kuveyt Türk Kurumsal Panelinden manuel iade ediniz.");
        }

        boolean iadeBasarili = kuveytTurkService.siparisIadeEt(siparisNo, order.getTotalAmount(), provizyonNo, ayniGunMu);

        if (iadeBasarili) {
            order.setStatus(ayniGunMu ? "İptal Edildi" : "İade Edildi");
            orderRepository.save(order);
            return ResponseEntity.ok(ayniGunMu ? "Gün sonu alınmadığı için İptal (Cancel) işlemi başarıyla yapıldı." : "Para iadesi (Refund) başarıyla yapıldı.");
        }

        return ResponseEntity.status(400).body("Banka işlemi reddetti. Müşteri kartı kısıtlı olabilir veya işlem durumu uyuşmuyor.");
    }
    // Kargo Takip Sistemi İçin: Sipariş ID'sine göre tekil sipariş getirme
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order != null) {
            return ResponseEntity.ok(order);
        } else {
            return ResponseEntity.status(404).body("Sipariş bulunamadı");
        }
    }
    @GetMapping("/track/{orderCode}")
    public ResponseEntity<Order> trackOrderByCode(@PathVariable String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @GetMapping("/test-yurtici-kayit-detay")
    public String testYurticiKayitDetay() {
        Order testOrder = new Order();
        testOrder.setId(9999L);
        testOrder.setOrderCode("TEST-9999");
        testOrder.setCustomerName("Lamas Test Müşterisi");
        testOrder.setDeliveryAddress("Test Mahallesi, Deneme Sokak No:1 Istanbul");

        // Ham hatayı veya XML'i direkt tarayıcıya basıyoruz
        return yurticiKargoService.kargoGonderisiOlusturTest(testOrder);
    }
    @GetMapping("/test-gercek-siparis/{id}")
    public String testGercekSiparis(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order != null) {
            // Bu metot Yurtiçi Kargo'nun vereceği cevabı doğrudan tarayıcıya yazar
            return yurticiKargoService.kargoGonderisiOlusturTest(order);
        }
        return "Sipariş bulunamadı.";
    }
}