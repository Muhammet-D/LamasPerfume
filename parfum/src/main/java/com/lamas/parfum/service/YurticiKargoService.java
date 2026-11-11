package com.lamas.parfum.service;

import com.lamas.parfum.model.Order;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class YurticiKargoService {

    @Value("${yurtici.kargo.username}")
    private String username;

    @Value("${yurtici.kargo.password}")
    private String password;

    @Value("${yurtici.kargo.ws-url}")
    private String wsUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // 1. GERÇEK YURTİÇİ KARGO SORGULAMA İŞLEMİ (DÜZELTİLDİ)
    public String kargoDurumuSorgula(String orderCode) {

        String soapRequest = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
                "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:shipping=\"http://yurticikargo.com.tr/ShippingOrderDispatcherServices\">" +
                "   <soapenv:Header/>" +
                "   <soapenv:Body>" +
                "      <shipping:queryShipment>" +
                "         <wsUserName>" + username + "</wsUserName>" +
                "         <wsPassword>" + password + "</wsPassword>" +
                "         <userLanguage>TR</userLanguage>" +
                "         <keys>" + orderCode + "</keys>" +
                "         <keyType>0</keyType>" + // 0: Senin Sipariş Numaran ile arama yapar
                "      </shipping:queryShipment>" +
                "   </soapenv:Body>" +
                "</soapenv:Envelope>";

        HttpHeaders headers = new HttpHeaders();
        // UTF-8 EKLENDİ
        headers.setContentType(org.springframework.http.MediaType.valueOf("text/xml; charset=utf-8"));
        headers.add("SOAPAction", "");

        HttpEntity<String> entity = new HttpEntity<>(soapRequest, headers);

        try {
            return restTemplate.postForObject(wsUrl, entity, String.class);
        } catch (Exception e) {
            System.err.println("Yurtiçi Kargo API Bağlantı Hatası: " + e.getMessage());
            return null;
        }
    }

    // 2. OTOMATİK KARGO KAYDI AÇMA İŞLEMİ (CREATE SHIPMENT - UTF-8 EKLENDİ)
    public boolean kargoGonderisiOlustur(Order order) {
        String referansKodu = order.getOrderCode() != null ? order.getOrderCode() : String.valueOf(order.getId());

        String soapRequest = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
                "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:shipping=\"http://yurticikargo.com.tr/ShippingOrderDispatcherServices\">" +
                "   <soapenv:Header/>" +
                "   <soapenv:Body>" +
                "      <shipping:createShipment>" +
                "         <wsUserName>" + username + "</wsUserName>" +
                "         <wsPassword>" + password + "</wsPassword>" +
                "         <userLanguage>TR</userLanguage>" +
                "         <ShippingOrderVO>" +
                "            <cargoKey>" + referansKodu + "</cargoKey>" +
                "            <invoiceKey>" + referansKodu + "</invoiceKey>" +
                "            <receiverCustName>" + order.getCustomerName() + "</receiverCustName>" +
                "            <receiverAddress>" + order.getDeliveryAddress() + "</receiverAddress>" +
                "            <receiverPhone1>5321112233</receiverPhone1>" +
                "            <cityName>İstanbul</cityName>" +
                "            <townName>Fatih</townName>" +
                "            <cargoType>2</cargoType>" +
                "            <payorTypeCode>1</payorTypeCode>" +
                "            <cargoCount>1</cargoCount>" +
                "<cargoDescription>Kozmetik / Parfüm</cargoDescription>" +
                "            <taxNumber>11111111111</taxNumber>" +
                "            <waybillNo>IRS" + referansKodu + "</waybillNo>" +
                "         </ShippingOrderVO>" +
                "      </shipping:createShipment>" +
                "   </soapenv:Body>" +
                "</soapenv:Envelope>";

        HttpHeaders headers = new HttpHeaders();
        // UTF-8 BURAYA DA EKLENDİ (Önceki kodunda eksikti)
        headers.setContentType(org.springframework.http.MediaType.valueOf("text/xml; charset=utf-8"));
        headers.add("SOAPAction", "");

        HttpEntity<String> entity = new HttpEntity<>(soapRequest, headers);

        try {
            String response = restTemplate.postForObject(wsUrl, entity, String.class);
            // DİKKAT: XML'in tamamını ve ham halini ekrana basıyoruz!
            System.out.println("Yurtiçi Kargo RAW YANITI: " + response);

            return response != null && !response.contains("Hata");
        } catch (Exception e) {
            System.err.println("Yurtiçi Kargo Kayıt Açılamadı: " + e.getMessage());
            return false;
        }
    }

    // 3. SADECE TEST İÇİN KULLANDIĞIMIZ METOT
    public String kargoGonderisiOlusturTest(Order order) {
        String referansKodu = order.getOrderCode() != null ? order.getOrderCode() : String.valueOf(order.getId());

        String soapRequest = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
                "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:shipping=\"http://yurticikargo.com.tr/ShippingOrderDispatcherServices\">" +
                "   <soapenv:Header/>" +
                "   <soapenv:Body>" +
                "      <shipping:createShipment>" +
                "         <wsUserName>" + username + "</wsUserName>" +
                "         <wsPassword>" + password + "</wsPassword>" +
                "         <userLanguage>TR</userLanguage>" +
                "         <ShippingOrderVO>" +
                "            <cargoKey>" + referansKodu + "</cargoKey>" +
                "            <invoiceKey>" + referansKodu + "</invoiceKey>" +
                "            <receiverCustName>" + order.getCustomerName() + "</receiverCustName>" +
                "            <receiverAddress>" + order.getDeliveryAddress() + "</receiverAddress>" +
                "            <receiverPhone1>5321112233</receiverPhone1>" +
                "            <cityName>İstanbul</cityName>" +
                "            <townName>Fatih</townName>" +
                "            <cargoType>2</cargoType>" +
                "            <payorTypeCode>1</payorTypeCode>" +
                "            <cargoCount>1</cargoCount>" +
                "<cargoDescription>Kozmetik / Parfüm</cargoDescription>" +
                "            <taxNumber>11111111111</taxNumber>" +
                "            <waybillNo>IRS" + referansKodu + "</waybillNo>" +
                "         </ShippingOrderVO>" +
                "      </shipping:createShipment>" +
                "   </soapenv:Body>" +
                "</soapenv:Envelope>";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.valueOf("text/xml; charset=utf-8"));
        headers.add("SOAPAction", "");

        HttpEntity<String> entity = new HttpEntity<>(soapRequest, headers);

        try {
            return restTemplate.postForObject(wsUrl, entity, String.class);
        } catch (Exception e) {
            return "BAĞLANTI VEYA SİSTEM HATASI: " + e.getMessage();
        }
    }
}