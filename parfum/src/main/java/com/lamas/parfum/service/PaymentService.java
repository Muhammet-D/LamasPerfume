package com.lamas.parfum.service;

import com.iyzipay.Options;
import com.iyzipay.model.*;
import com.iyzipay.request.CreateCheckoutFormInitializeRequest;
import com.lamas.parfum.model.Order;
import org.springframework.stereotype.Service;
import com.lamas.parfum.model.OrderItem;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class PaymentService {

    private final Options iyzicoOptions;

    // Ayarlarımızı otomatik olarak içeri alıyoruz
    public PaymentService(Options iyzicoOptions) {
        this.iyzicoOptions = iyzicoOptions;
    }

    public String odemeEkraniOlustur(Order order) {
        // 1. İSTEK HAZIRLIĞI
        CreateCheckoutFormInitializeRequest request = new CreateCheckoutFormInitializeRequest();
        request.setLocale(Locale.TR.name());
        request.setPrice(new BigDecimal(String.valueOf(order.getTotalAmount())));
        request.setPaidPrice(new BigDecimal(String.valueOf(order.getTotalAmount())));
        request.setCurrency(Currency.TRY.name());
        request.setPaymentGroup(PaymentGroup.PRODUCT.name());
        request.setConversationId(String.valueOf(order.getId()));
        request.setBasketId(String.valueOf(order.getId()));
        request.setCallbackUrl("https://www.lamasperfume.com/api/payment/callback?siparisId=" + order.getId());

        // 2. MÜŞTERİ BİLGİLERİ (Buyer)
        Buyer buyer = new Buyer();
        buyer.setId(order.getUserId() != null ? String.valueOf(order.getUserId()) : "MISAFIR_123");

        // İsmi Ad ve Soyad olarak ikiye ayırma (iyzico ayrı ayrı ister)
        String fullName = order.getCustomerName() != null ? order.getCustomerName() : "Misafir Müşteri";
        String[] adSoyad = fullName.split(" ", 2);
        buyer.setName(adSoyad[0]);
        buyer.setSurname(adSoyad.length > 1 ? adSoyad[1] : "Müşteri");

        buyer.setGsmNumber(order.getCustomerPhone() != null ? order.getCustomerPhone() : "+905555555555");
        buyer.setEmail(order.getContactEmail() != null ? order.getContactEmail() : "info@lamasparfum.com");
        buyer.setIdentityNumber("11111111111"); // TC yoksa dummy girilir
        buyer.setRegistrationAddress(order.getDeliveryAddress() != null ? order.getDeliveryAddress() : "Adres Belirtilmedi");
        buyer.setIp("85.34.78.112"); // Gerçekte request.getRemoteAddr() ile müşterinin IP'si alınır
        buyer.setCity("Istanbul"); // Fatura entegrasyonunda veritabanından çekilecek
        buyer.setCountry("Turkey");
        buyer.setZipCode("34000");
        request.setBuyer(buyer);

        // FATURA VE TESLİMAT ADRESİ
        Address address = new Address();
        address.setContactName(fullName);
        address.setCity("Istanbul");
        address.setCountry("Turkey");
        address.setAddress(order.getDeliveryAddress() != null ? order.getDeliveryAddress() : "Adres Belirtilmedi");
        address.setZipCode("34000");
        request.setShippingAddress(address);
        request.setBillingAddress(address); // İkisini de aynı adres kabul ediyoruz

        // ... (1. ve 2. Adımlar aynı kalıyor: request ve buyer ayarları) ...

        // 3. SEPETTEKİ PARFÜMLERİ EKLİYORUZ (Basket Items)
        List<BasketItem> basketItems = new ArrayList<>();

        // 🌟 İYZİCO TERAZİSİ: Hassas matematik motoru
        BigDecimal hesaplananToplam = BigDecimal.ZERO;

        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                BasketItem basketItem = new BasketItem();
                basketItem.setId(String.valueOf(item.getProductId()));
                basketItem.setName(item.getTitle() != null ? item.getTitle() : "Lamas Parfüm");
                basketItem.setCategory1("Kozmetik");
                basketItem.setCategory2("Parfüm");
                basketItem.setItemType(BasketItemType.PHYSICAL.name());

                // Hassas çarpma işlemi (Birim Fiyat x Adet)
                BigDecimal adet = new BigDecimal(item.getQuantity());
                BigDecimal birimFiyat = new BigDecimal(String.valueOf(item.getPrice()));
                BigDecimal urunToplami = birimFiyat.multiply(adet);

                basketItem.setPrice(urunToplami);
                basketItems.add(basketItem);

                // Ürün fiyatını teraziye ekle
                hesaplananToplam = hesaplananToplam.add(urunToplami);
            }
        }

        // 4. KARGO KONTROLÜ VE EKLENMESİ
        // Eğer Frontend'den gelen toplam, parfümlerin toplamından büyükse aradaki fark kesinlikle kargodur!
        BigDecimal frontendToplam = new BigDecimal(String.valueOf(order.getTotalAmount()));

        if (frontendToplam.compareTo(hesaplananToplam) > 0) {
            BigDecimal kargoFarki = frontendToplam.subtract(hesaplananToplam);

            BasketItem kargoItem = new BasketItem();
            kargoItem.setId("KARGO");
            kargoItem.setName("Kargo Ücreti");
            kargoItem.setCategory1("Hizmet");
            kargoItem.setCategory2("Kargo");
            kargoItem.setItemType(BasketItemType.VIRTUAL.name()); // Fiziksel değil, kargo hizmeti
            kargoItem.setPrice(kargoFarki);

            basketItems.add(kargoItem);

            // Kargo fiyatını da teraziye ekle
            hesaplananToplam = hesaplananToplam.add(kargoFarki);
        }

        request.setBasketItems(basketItems);

        // 🌟 5. EN KRİTİK NOKTA: Hata kodunu engelleyen satır
        // İyzico'ya diyoruz ki: "Dışarıdan gelen fiyatı boş ver, sen benim kendi terazimden çıkan bu kusursuz toplamı çek!"
        request.setPrice(hesaplananToplam);
        request.setPaidPrice(hesaplananToplam);

        // 6. İYZİCO'YA İSTEK AT
        CheckoutFormInitialize checkoutFormInitialize = CheckoutFormInitialize.create(request, iyzicoOptions);

        // 🌟 KESİN ÇÖZÜM: İyzico'nun bize ne cevap verdiğini konsola yazdıralım!
        System.out.println("--- İYZİCO İSTEK SONUCU ---");
        System.out.println("Status (Durum): " + checkoutFormInitialize.getStatus());
        System.out.println("Error Code (Hata Kodu): " + checkoutFormInitialize.getErrorCode());
        System.out.println("Error Message (Hata Mesajı): " + checkoutFormInitialize.getErrorMessage());
        System.out.println("--------------------------");

        if (!"success".equalsIgnoreCase(checkoutFormInitialize.getStatus())) {
            // Eğer başarı dönmediyse, HTML yerine İyzico'nun hata mesajını fırlatalım
            return null;
        }

        return checkoutFormInitialize.getCheckoutFormContent();
    }
}