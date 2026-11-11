package com.lamas.parfum.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.draw.LineSeparator;
import com.lamas.parfum.model.Order;
import org.springframework.beans.factory.annotation.Autowired; // 🌟 1. BU IMPORT EKSİK OLDUĞU İÇİN KIZARIR
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TelegramNotificationService {

    private final String BOT_TOKEN = "8514865268:AAEM3SRXeafL4_pAAzj58NRtOq8_J03xK_0";
    private final List<String> CHAT_IDS = Arrays.asList("1273093409", "6433973622");

    @Autowired
    private RestTemplate restTemplate;

    public void mesajGonder(String text) {
        try {
            String url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";

            // 🌟 2. CHAT_IDS LİSTESİNİ DÖNGÜYE ALARAK TEK TEK GÖNDERİYORUZ
            for (String chatId : CHAT_IDS) {
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("chat_id", chatId);
                requestBody.put("text", text);
                requestBody.put("parse_mode", "Markdown");

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

                restTemplate.postForEntity(url, request, String.class);
            }

        } catch (Exception e) {
            System.out.println("🚨 Telegram mesajı gönderilemedi: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // (Devamındaki siparisBildirVePdfAt ve diğer metodlar aynen kalabilir...)
    public void siparisBildirVePdfAt(Order order) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // --- 1. RENK VE FONT AYARLARI ---
            BaseColor lamasGold = new BaseColor(212, 175, 55);
            BaseColor lightGray = new BaseColor(150, 150, 150);
            BaseColor darkGray = new BaseColor(50, 50, 50);

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, lamasGold);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 12, lightGray);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, darkGray);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11, darkGray);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.BLACK);
            Font grandTotalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, lamasGold);

            // --- 2. ÜST BİLGİ VE BARKOD (TABLO YAPISI) ---
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{60, 40});

            // Sol Taraf: Logo / Başlık
            PdfPCell titleCell = new PdfPCell(new Phrase("LAMAS PARFUM", titleFont));
            titleCell.setBorder(Rectangle.NO_BORDER);
            titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            headerTable.addCell(titleCell);

            // Sağ Taraf: Barkod
            PdfPCell barcodeCell = new PdfPCell();
            barcodeCell.setBorder(Rectangle.NO_BORDER);
            barcodeCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

            if (order.getTrackingNumber() != null && !order.getTrackingNumber().isEmpty()) {
                Paragraph trackingText = new Paragraph("Siparis / Ref No: " + order.getTrackingNumber(), boldFont);
                trackingText.setAlignment(Element.ALIGN_RIGHT);
                barcodeCell.addElement(trackingText);
            }
            headerTable.addCell(barcodeCell);
            document.add(headerTable);

            // Alt Başlık
            Paragraph subtitle = new Paragraph("Siparis Ozeti / Teslimat Belgesi", subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingBefore(10);
            subtitle.setSpacingAfter(10);
            document.add(subtitle);

            // Altın Sarısı Ayırıcı Çizgi
            LineSeparator goldLine = new LineSeparator(1f, 100, lamasGold, Element.ALIGN_CENTER, -2);
            document.add(new Chunk(goldLine));

            // --- 3. MÜŞTERİ VE SİPARİŞ DETAYLARI ---
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setWidths(new float[]{25, 75});
            infoTable.setSpacingBefore(15);

            String tarihStr = order.getOrderDate() != null ?
                    order.getOrderDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "";

            addInfoRow(infoTable, "Siparis No:", "#" + order.getOrderCode(), boldFont, normalFont);
            addInfoRow(infoTable, "Tarih:", tarihStr, boldFont, normalFont);
            addInfoRow(infoTable, "Musteri Adi:", trTemizle(order.getCustomerName()), boldFont, normalFont);
            addInfoRow(infoTable, "Adres:", trTemizle(order.getDeliveryAddress()), boldFont, normalFont);
            document.add(infoTable);

            // --- 4. SATIN ALINAN ÜRÜNLER ---
            Paragraph prodTitle = new Paragraph("Satin Alinan Urunler:", sectionTitleFont);
            prodTitle.setSpacingBefore(20);
            prodTitle.setSpacingAfter(5);
            document.add(prodTitle);

            LineSeparator grayLine = new LineSeparator(1f, 100, new BaseColor(200, 200, 200), Element.ALIGN_CENTER, -2);
            document.add(new Chunk(grayLine));

            PdfPTable itemsTable = new PdfPTable(2);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{80, 20});
            itemsTable.setSpacingBefore(10);

            // Eğer Order nesnesinde getItems() tanımlıysa döngüyle ürünleri basıyoruz
            try {
                if (order.getItems() != null && !order.getItems().isEmpty()) {
                    order.getItems().forEach(item -> {
                        String urunMetni = item.getQuantity() + " Adet - " + trTemizle(item.getTitle()) + " (" + trTemizle(item.getSize()) + ")";
                        PdfPCell leftCell = new PdfPCell(new Phrase(urunMetni, normalFont));
                        leftCell.setBorder(Rectangle.NO_BORDER);
                        leftCell.setPaddingBottom(8);

                        String fiyatMetni = (item.getPrice() * item.getQuantity()) + " TL";
                        PdfPCell rightCell = new PdfPCell(new Phrase(fiyatMetni, normalFont));
                        rightCell.setBorder(Rectangle.NO_BORDER);
                        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                        rightCell.setPaddingBottom(8);

                        itemsTable.addCell(leftCell);
                        itemsTable.addCell(rightCell);
                    });
                }
            } catch (Exception ignored) {
                // Güvenlik Ağı: Ürünler çekilemezse boş geç
            }

            document.add(itemsTable);
            document.add(new Chunk(grayLine));

            // --- 5. GENEL TOPLAM ---
            PdfPTable totalTable = new PdfPTable(2);
            totalTable.setWidthPercentage(100);
            totalTable.setWidths(new float[]{75, 25});
            totalTable.setSpacingBefore(10);

            PdfPCell totalLabel = new PdfPCell(new Phrase("Genel Toplam:", sectionTitleFont));
            totalLabel.setBorder(Rectangle.NO_BORDER);
            totalLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);

            PdfPCell totalValue = new PdfPCell(new Phrase(order.getTotalAmount() + " TL", grandTotalFont));
            totalValue.setBorder(Rectangle.NO_BORDER);
            totalValue.setHorizontalAlignment(Element.ALIGN_RIGHT);

            totalTable.addCell(totalLabel);
            totalTable.addCell(totalValue);
            document.add(totalTable);

            // --- 6. ALT BİLGİ (FOOTER) ---
            Paragraph footer = new Paragraph("Bu belge Lamas Parfum sistemi tarafindan otomatik olusturulmustur.", FontFactory.getFont(FontFactory.HELVETICA, 9, lightGray));
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(50);
            document.add(footer);

            document.close();
            byte[] pdfBytes = out.toByteArray();

            // --- 7. TELEGRAM MESAJ GÖNDERİMİ ---
            String mesaj = "🚨 *YENİ SİPARİŞ GELDİ!* 🚨\n\n" +
                    "📦 *Sipariş No:* #" + order.getId() + "\n" +
                    "👤 *Müşteri:* " + order.getCustomerName() + "\n" +
                    "💰 *Tutar:* " + order.getTotalAmount() + " TL\n" +
                    "🚚 *Kargo Kodu:* " + (order.getTrackingNumber() != null ? order.getTrackingNumber() : "Bekliyor") + "\n\n" +
                    "Fatura PDF olarak ektedir. Kolay gelsin patron!";

            RestTemplate restTemplate = new RestTemplate();
            String url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendDocument";

            ByteArrayResource pdfDosyasi = new ByteArrayResource(pdfBytes) {
                @Override
                public String getFilename() {
                    return "Lamas_Siparis_" + order.getId() + ".pdf";
                }
            };

            for (String chatId : CHAT_IDS) {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("chat_id", chatId);
                body.add("caption", mesaj);
                body.add("parse_mode", "Markdown");
                body.add("document", pdfDosyasi);

                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
                restTemplate.postForObject(url, requestEntity, String.class);
            }

        } catch (Exception e) {
            System.out.println("Telegram PDF bildirimi başarısız: " + e.getMessage());
        }
    }

    // PDF Tabloları için yardımcı metot
    private void addInfoRow(PdfPTable table, String label, String value, Font boldFont, Font normalFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, boldFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPaddingBottom(6);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, normalFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPaddingBottom(6);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    // Türkçe karakterleri temizleyen yardımcı metot
    private String trTemizle(String metin) {
        if (metin == null) return "";
        return metin.replace("ğ", "g").replace("Ğ", "G")
                .replace("ü", "u").replace("Ü", "U")
                .replace("ş", "s").replace("Ş", "S")
                .replace("ı", "i").replace("İ", "I")
                .replace("ö", "o").replace("Ö", "O")
                .replace("ç", "c").replace("Ç", "C");
    }
}