package com.lamas.parfum.config;

import com.lamas.parfum.component.OrderRepository;
import com.lamas.parfum.model.Order;
import com.lamas.parfum.service.EmailService;
import com.lamas.parfum.service.YurticiKargoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class KargoTakipScheduler {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private YurticiKargoService yurticiKargoService;

    @Autowired
    private EmailService emailService;

    // Her 30 dakikada bir otomatik çalışır (1800000 milisaniye)
    @Scheduled(fixedDelay = 1800000)
    public void kargoDurumlariniSorgula() {

        // Sadece durumu "Hazırlanıyor" veya "Kargoya Verildi" olanları tararız,
        // teslim edilmişlerle vakit kaybetmeyiz.
        List<Order> aktifSiparisler = orderRepository.findByStatusIn(List.of("Hazırlanıyor", "Kargoya Verildi"));

        for (Order order : aktifSiparisler) {
            String referansKodu = order.getOrderCode() != null ? order.getOrderCode() : String.valueOf(order.getId());

            // Yurtiçi Kargo'ya soruyoruz
            String xmlResponse = yurticiKargoService.kargoDurumuSorgula(referansKodu);

            if (xmlResponse == null) continue;

            // Kargo kabul edilmiş ve yola çıkmış (operationStatus veya islemKodu'na göre)
            // Not: Yurtiçi Kargo'nun tam XML yanıtına göre bu "<shippingStatus>1</shippingStatus>" gibi bir kod olabilir.
            if (xmlResponse.contains("Yola Çıktı") && "Hazırlanıyor".equals(order.getStatus())) {

                order.setStatus("Kargoya Verildi");
                orderRepository.save(order);

                String mesaj = "Merhaba " + order.getCustomerName() + ",\n\n"
                        + "Lamas siparişiniz Yurtiçi Kargo'ya teslim edilmiştir.\n"
                        + "Siparişinizi sitemizdeki Sipariş Takibi ekranından takip edebilirsiniz.\n\n"
                        + "Bizi tercih ettiğiniz için teşekkür ederiz.";

                emailService.siparisDurumMailiGonder(order.getContactEmail(), order.getCustomerName(),
                        referansKodu, mesaj);
            }
            // Eğer teslim edildiyse
            else if (xmlResponse.contains("Teslim Edildi") && !"Teslim Edildi".equals(order.getStatus())) {

                order.setStatus("Teslim Edildi");
                orderRepository.save(order);

                String mesaj = "Merhaba " + order.getCustomerName() + ",\n\n"
                        + "Lamas siparişiniz kargo firması tarafından başarıyla teslim edilmiştir. Güzel günlerde kullanmanızı dileriz!\n\n"
                        + "Bizi tercih ettiğiniz için teşekkür ederiz.";

                emailService.siparisDurumMailiGonder(order.getContactEmail(), order.getCustomerName(),
                        referansKodu, mesaj);
            }
        }
    }
}