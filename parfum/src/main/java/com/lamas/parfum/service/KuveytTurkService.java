package com.lamas.parfum.service;

import com.lamas.parfum.config.KuveytTurkConfig;
import com.lamas.parfum.model.Order;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.security.MessageDigest;
import java.util.Base64;

import static com.lamas.parfum.config.KuveytTurkConfig.*;

@Service
public class KuveytTurkService {

    private final RestTemplate restTemplate = new RestTemplate();

    private String hashUret(String data) throws Exception {
        MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
        byte[] hashBytes = sha1.digest(data.getBytes("ISO-8859-9"));
        return Base64.getEncoder().encodeToString(hashBytes);
    }

    public String kuveytTurkFormuOlustur(Order order, String kartNo, String ay, String yil, String cvv) {
        try {
            String siparisNo = String.valueOf(order.getId());
            String tutar = String.valueOf(Math.round(order.getTotalAmount() * 100));

            String temizKartNo = kartNo != null ? kartNo.replaceAll("[^0-9]", "") : "";
            String guvenliYil = yil.length() > 2 ? yil.substring(yil.length() - 2) : yil;
            String guvenliAy = ay.length() == 1 ? "0" + ay : ay;

            String cardType = "MasterCard";
            if (temizKartNo.startsWith("4")) {
                cardType = "Visa";
            } else if (temizKartNo.startsWith("9") || temizKartNo.startsWith("5")) {
                cardType = temizKartNo.startsWith("9") ? "Troy" : "MasterCard";
            }

            String hashPassword = hashUret(PASSWORD);
            String hashStr = MERCHANT_ID + siparisNo + tutar + KuveytTurkConfig.CALLBACK_URL + KuveytTurkConfig.CALLBACK_URL + KuveytTurkConfig.USER_NAME + hashPassword;
            String hashData = hashUret(hashStr);

            String xml = "<KuveytTurkVPosMessage xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">" +
                    "<APIVersion>TDV2.0.0</APIVersion>" +
                    "<OkUrl>" + KuveytTurkConfig.CALLBACK_URL + "</OkUrl>" +
                    "<FailUrl>" + KuveytTurkConfig.CALLBACK_URL + "</FailUrl>" +
                    "<HashData>" + hashData + "</HashData>" +
                    "<MerchantId>" + MERCHANT_ID + "</MerchantId>" +
                    "<CustomerId>" + CUSTOMER_ID + "</CustomerId>" +
                    "<DeviceData><DeviceChannel>02</DeviceChannel><ClientIP>31.57.77.242</ClientIP></DeviceData>" +
                    "<CardHolderData>" +
                    "<BillAddrCity>Istanbul</BillAddrCity><BillAddrCountry>792</BillAddrCountry>" +
                    "<BillAddrLine1>Musteri Adresi Bilgisi</BillAddrLine1><BillAddrPostCode>34000</BillAddrPostCode><BillAddrState>34</BillAddrState>" +
                    "<Email>mail@lamasperfume.com</Email><MobilePhone><Cc>90</Cc><Subscriber>5551234567</Subscriber></MobilePhone>" +
                    "</CardHolderData>" +
                    "<UserName>" + KuveytTurkConfig.USER_NAME + "</UserName>" +
                    "<CardNumber>" + temizKartNo + "</CardNumber>" +
                    "<CardExpireDateYear>" + guvenliYil + "</CardExpireDateYear>" +
                    "<CardExpireDateMonth>" + guvenliAy + "</CardExpireDateMonth>" +
                    "<CardCVV2>" + cvv + "</CardCVV2>" +
                    "<CardHolderName>Lamas Musteri</CardHolderName>" +
                    "<CardType>" + cardType + "</CardType>" +
                    "<TransactionType>Sale</TransactionType>" +
                    "<InstallmentCount>0</InstallmentCount>" +
                    "<Amount>" + tutar + "</Amount>" +
                    "<DisplayAmount>" + tutar + "</DisplayAmount>" +
                    "<CurrencyCode>0949</CurrencyCode>" +
                    "<MerchantOrderId>" + siparisNo + "</MerchantOrderId>" +
                    "<TransactionSecurity>3</TransactionSecurity>" +
                    "</KuveytTurkVPosMessage>";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_XML);
            HttpEntity<String> request = new HttpEntity<>(xml, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(KuveytTurkConfig.PAYGATE_URL, request, String.class);
            return response.getBody();

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public String otorizasyonAl(String siparisNo, String tutar, String mdToken) {
        try {
            String hashPassword = hashUret(PASSWORD);
            String hashStr = MERCHANT_ID + siparisNo + tutar + KuveytTurkConfig.USER_NAME + hashPassword;
            String hashData = hashUret(hashStr);

            String xml = "<KuveytTurkVPosMessage xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">" +
                    "<APIVersion>TDV2.0.0</APIVersion>" +
                    "<HashData>" + hashData + "</HashData>" +
                    "<MerchantId>" + MERCHANT_ID + "</MerchantId>" +
                    "<CustomerId>" + CUSTOMER_ID + "</CustomerId>" +
                    "<UserName>" + KuveytTurkConfig.USER_NAME + "</UserName>" +
                    "<TransactionType>Sale</TransactionType>" +
                    "<InstallmentCount>0</InstallmentCount>" +
                    "<Amount>" + tutar + "</Amount>" +
                    "<CurrencyCode>0949</CurrencyCode>" +
                    "<MerchantOrderId>" + siparisNo + "</MerchantOrderId>" +
                    "<TransactionSecurity>3</TransactionSecurity>" +
                    "<KuveytTurkVPosAdditionalData><AdditionalData><Key>MD</Key><Data>" + mdToken + "</Data></AdditionalData></KuveytTurkVPosAdditionalData>" +
                    "</KuveytTurkVPosMessage>";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_XML);
            HttpEntity<String> request = new HttpEntity<>(xml, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(KuveytTurkConfig.PROVISION_URL, request, String.class);
            String body = response.getBody();

            System.out.println("🚨 KUVEYT TÜRK OTORİZASYON YANITI: \n" + body);

            // Başarılıysa XML içinden Provizyon Numarasını yakalayıp gönderiyoruz
            if (body != null && body.contains("<ResponseCode>00</ResponseCode>")) {
                int start = body.indexOf("<ProvisionNumber>");
                if (start != -1) {
                    start += 17;
                    int end = body.indexOf("</ProvisionNumber>", start);
                    return body.substring(start, end);
                }
                return "000000"; // Hata payı için yedek
            }
            return null; // Otorizasyon başarısız
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public boolean siparisIadeEt(String siparisNo, double iadeTutari, String provizyonNo, boolean ayniGunMu) {
        try {
            String tutarStr = String.valueOf((int) Math.round(iadeTutari * 100));

            // 🌟 SİHİRLİ KONTROL: Bugünse İptal (Cancel), Eskiyse İade (Refund)
            String islemTuru = ayniGunMu ? "Cancel" : "Refund";

            String hashPassword = hashUret(PASSWORD);
            String hashStr = MERCHANT_ID + siparisNo + tutarStr + KuveytTurkConfig.USER_NAME + hashPassword;
            String hashData = hashUret(hashStr);

            // Provizyon numarası varsa XML'e ekle
            String provizyonXml = (provizyonNo != null && !provizyonNo.isEmpty()) ? "<ProvisionNumber>" + provizyonNo + "</ProvisionNumber>" : "";

            String iadeXml = "<KuveytTurkVPosMessage xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">" +
                    "<APIVersion>TDV2.0.0</APIVersion>" +
                    "<HashData>" + hashData + "</HashData>" +
                    "<MerchantId>" + MERCHANT_ID + "</MerchantId>" +
                    "<CustomerId>" + CUSTOMER_ID + "</CustomerId>" +
                    "<UserName>" + KuveytTurkConfig.USER_NAME + "</UserName>" +
                    "<TransactionType>" + islemTuru + "</TransactionType>" +
                    "<Amount>" + tutarStr + "</Amount>" +
                    "<CurrencyCode>0949</CurrencyCode>" +
                    "<MerchantOrderId>" + siparisNo + "</MerchantOrderId>" +
                    provizyonXml +
                    "</KuveytTurkVPosMessage>";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_XML);
            HttpEntity<String> request = new HttpEntity<>(iadeXml, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(KuveytTurkConfig.PAYGATE_URL, request, String.class);

            System.out.println("🚨 KUVEYT TÜRK İŞLEMİ (" + islemTuru + ") YANITI: \n" + response.getBody());

            return response.getBody() != null && response.getBody().contains("<ResponseCode>00</ResponseCode>");

        } catch (Exception e) {
            System.out.println("🚨 İADE/İPTAL HATASI: " + e.getMessage());
            return false;
        }
    }
}