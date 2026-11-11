package com.lamas.parfum.controller;

import com.lamas.parfum.component.OrderRepository;
import com.lamas.parfum.model.Order;
import com.lamas.parfum.service.EmailService;
import com.lamas.parfum.service.KuveytTurkService;
import com.lamas.parfum.service.TelegramNotificationService;
import com.lamas.parfum.service.YurticiKargoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.util.Map;

@RestController
@RequestMapping("/api/kuveytturk")
public class KuveytTurkController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private KuveytTurkService kuveytTurkService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private TelegramNotificationService telegramNotificationService;

    @Autowired
    private YurticiKargoService yurticiKargoService;


    @PostMapping("/pay")
    public String odemeBaslat(@RequestBody PaymentRequest request) {
        Order order = request.getOrder();
        order.setStatus("Beklemede");
        order.setOrderDate(java.time.LocalDateTime.now());
        orderRepository.save(order);

        String bankaFormu = kuveytTurkService.kuveytTurkFormuOlustur(order, request.getKartNo(), request.getAy(), request.getYil(), request.getCvv());

        // 🌟 BANKADAN GELEN HAM YANITI KONSOLA YAZDIR
        System.out.println("🚨 KUVEYT TÜRK PAYGATE HAM YANITI: " + bankaFormu);

        return bankaFormu;
    }

    @RequestMapping(value = "/callback", method = {RequestMethod.POST, RequestMethod.GET})
    public String kuveytTurkSonucYakalayici(@RequestParam Map<String, String> tumCevaplar) {
        try {
            System.out.println("=== KUVEYT TÜRK'TEN GELEN CEVAP ===");
            tumCevaplar.forEach((key, value) -> System.out.println(key + " : " + value));

            String authResponse = tumCevaplar.get("AuthenticationResponse");

            // 🌟 URL-ENCODE EDİLMİŞ XML'İ ÇÖZÜYORUZ
            if (authResponse != null && !authResponse.isEmpty()) {
                authResponse = URLDecoder.decode(authResponse, "UTF-8");
            }

            String responseCode = "";
            String siparisNo = "";
            String mdToken = "";
            String hataMesaji = "";
            String bankaTutari = "0";

            if (authResponse != null && !authResponse.isEmpty()) {
                responseCode = xmlArasindanCek(authResponse, "ResponseCode");
                siparisNo = xmlArasindanCek(authResponse, "MerchantOrderId");
                mdToken = xmlArasindanCek(authResponse, "MD").replace(" ", "+");
                bankaTutari = xmlArasindanCek(authResponse, "Amount");
                hataMesaji = xmlArasindanCek(authResponse, "ResponseMessage");
            } else {
                responseCode = tumCevaplar.getOrDefault("ResponseCode", "");
                hataMesaji = tumCevaplar.getOrDefault("ResponseMessage", "");
                siparisNo = tumCevaplar.getOrDefault("MerchantOrderId", "");
            }

            System.out.println("Çözülen ResponseCode: " + responseCode);
            System.out.println("Çözülen Sipariş No: " + siparisNo);
            System.out.println("Çözülen Tutar: " + bankaTutari);

            if ("00".equals(responseCode)) {
                String asilIdStr = siparisNo.contains("-") ? siparisNo.split("-")[0] : siparisNo;
                Long orderId = Long.parseLong(asilIdStr);

                Order order = orderRepository.findById(orderId).orElse(null);

                if(order != null) {
                    // Boolean yerine doğrudan Provizyon Numarasını alıyoruz
                    String provizyonNo = kuveytTurkService.otorizasyonAl(siparisNo, bankaTutari, mdToken);

                    if(provizyonNo != null) {
                        order.setStatus("Sipariş Alındı");
                        order.setProvisionNumber(provizyonNo); // SİSTEME KAYDEDİLDİ



                        orderRepository.save(order);

                        emailService.siparisAlindiMailiGonder(order);

                        telegramNotificationService.siparisBildirVePdfAt(order);

                        String takipNo = order.getOrderCode() != null ? order.getOrderCode() : String.valueOf(order.getId());
                        return "<script>window.top.location.href = '/siparis-ozeti.html?no=" + takipNo + "';</script>";
                    } else {
                        return "<script>alert('Banka ödemeyi onayladı fakat Otorizasyon (Para Çekme) aşamasında reddetti.'); window.top.location.href = '/sepet.html';</script>";
                    }
                }
            }

            return "<script>alert('Ödeme tamamlanamadı: " + hataMesaji + "'); window.top.location.href = '/sepet.html';</script>";

        } catch (Exception e) {
            e.printStackTrace();
            return "<script>alert('Callback Hatası: " + e.getMessage() + "'); window.top.location.href = '/sepet.html';</script>";
        }
    }



    @GetMapping("/api/test-mail/{id}")
    public String testMailGonder(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order != null) {
            emailService.siparisAlindiMailiGonder(order);
            return "Test maili başarıyla gönderildi: " + order.getContactEmail();
        }
        return "Sipariş bulunamadı!";
    }

    // GÜVENLİ XML ÇEKİCİ (Aynı Kalıyor)
    private String xmlArasindanCek(String xml, String tag) {
        try {
            String openTag = "<" + tag + ">";
            String closeTag = "</" + tag + ">";
            int start = xml.indexOf(openTag);
            if(start == -1) return "";
            start += openTag.length();
            int end = xml.indexOf(closeTag, start);
            if(end == -1) return "";
            return xml.substring(start, end);
        } catch (Exception e) {
            return "";
        }
    }

    @PostMapping("/refund/{id}")
    public ResponseEntity<?> iadeIslemiBaslat(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Sipariş bulunamadı"));

        String siparisNo = String.valueOf(order.getId());
        String provizyonNo = order.getProvisionNumber();

        // 🌟 TARİH KONTROLÜ: Sipariş bugün mü verilmiş yoksa eski mi?
        boolean ayniGunMu = order.getOrderDate() != null &&
                order.getOrderDate().toLocalDate().isEqual(java.time.LocalDate.now());

        // Eski siparişse ve elimizde veritabanına kaydettiğimiz provizyon no yoksa sistemi kilitle, hatayı göster
        if (!ayniGunMu && (provizyonNo == null || provizyonNo.isEmpty() || "000000".equals(provizyonNo))) {
            return ResponseEntity.status(400).body("Bu eski bir sipariş olduğu için iade şifresi sistemde yok. Lütfen Kuveyt Türk Kurumsal Panelinden manuel iade ediniz.");
        }

        // Akıllı motorumuzla isteği bankaya gönderiyoruz (4 parametre oldu)
        boolean iadeBasarili = kuveytTurkService.siparisIadeEt(siparisNo, order.getTotalAmount(), provizyonNo, ayniGunMu);

        if (iadeBasarili) {
            order.setStatus(ayniGunMu ? "İptal Edildi" : "İade Edildi");
            orderRepository.save(order);
            return ResponseEntity.ok(ayniGunMu ? "Gün sonu alınmadığı için İptal (Cancel) işlemi başarıyla yapıldı." : "Para iadesi (Refund) başarıyla yapıldı.");
        }

        return ResponseEntity.status(400).body("Banka işlemi reddetti. Müşteri kartı kısıtlı olabilir veya işlem durumu uyuşmuyor.");
    }
    public static class PaymentRequest {
        private Order order;
        private String kartNo;
        private String ay;
        private String yil;
        private String cvv;

        public Order getOrder() { return order; }
        public void setOrder(Order order) { this.order = order; }
        public String getKartNo() { return kartNo; }
        public void setKartNo(String kartNo) { this.kartNo = kartNo; }
        public String getAy() { return ay; }
        public void setAy(String ay) { this.ay = ay; }
        public String getYil() { return yil; }
        public void setYil(String yil) { this.yil = yil; }
        public String getCvv() { return cvv; }
        public void setCvv(String cvv) { this.cvv = cvv; }
    }
}