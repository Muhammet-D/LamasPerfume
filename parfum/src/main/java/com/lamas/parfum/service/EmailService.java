package com.lamas.parfum.service;

import com.lamas.parfum.model.Order;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // =========================================================
    // 1. SİPARİŞ ALINDI MAİLİ (Detaylı, Ürün Fotoğraflı HTML)
    // =========================================================
    public void siparisAlindiMailiGonder(Order order) {
        try {
            MimeMessage mesaj = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mesaj, true, "UTF-8");

            // EKSİK OLAN HAYATİ SATIR EKLENDİ
            helper.setFrom("lamas@lamasperfume.com", "Lamas Parfüm");

            helper.setTo(order.getContactEmail());
            helper.setSubject("Siparişiniz Alındı! - Lamas Parfüm (#" + order.getOrderCode() + ")");

            StringBuilder htmlMsg = new StringBuilder();
            htmlMsg.append("<div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 25px; border-radius: 10px;'>");
            htmlMsg.append("<div style='text-align: center; margin-bottom: 20px;'><h2 style='color: #D4AF37; margin: 0;'>Siparişiniz İçin Teşekkür Ederiz!</h2></div>");
            htmlMsg.append("<p>Merhaba <strong>").append(order.getCustomerName()).append("</strong>,</p>");
            htmlMsg.append("<p><strong>#").append(order.getOrderCode()).append("</strong> numaralı siparişiniz başarıyla sistemimize ulaşmıştır. Sipariş detaylarınızı aşağıda bulabilirsiniz:</p>");

            htmlMsg.append("<table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>");
            htmlMsg.append("<tr style='background-color: #f6f1e8; border-bottom: 2px solid #D4AF37;'>");
            htmlMsg.append("<th style='padding: 10px; text-align: left;'>Ürün</th>");
            htmlMsg.append("<th style='padding: 10px; text-align: left;'>Detay</th>");
            htmlMsg.append("<th style='padding: 10px; text-align: right;'>Fiyat</th>");
            htmlMsg.append("</tr>");

            if (order.getItems() != null) {
                for (var item : order.getItems()) {
                    htmlMsg.append("<tr style='border-bottom: 1px solid #eaeaea;'>");
                    htmlMsg.append("<td style='padding: 10px; width: 80px;'><img src='https://www.lamasperfume.com/").append(item.getImgurl()).append("' alt='").append(item.getTitle()).append("' style='width: 70px; border-radius: 5px;'/></td>");
                    htmlMsg.append("<td style='padding: 10px;'><strong>").append(item.getTitle()).append("</strong><br><span style='font-size: 12px; color: #777;'>").append(item.getSize()).append(" | Adet: ").append(item.getQuantity()).append("</span></td>");
                    htmlMsg.append("<td style='padding: 10px; text-align: right; font-weight: bold;'>").append(item.getPrice() * item.getQuantity()).append(" TL</td>");
                    htmlMsg.append("</tr>");
                }
            }

            htmlMsg.append("</table>");
            htmlMsg.append("<h3 style='text-align: right; color: #D4AF37; margin-top: 20px;'>Genel Toplam: ").append(order.getTotalAmount()).append(" TL</h3>");
            htmlMsg.append("<p style='margin-top: 30px;'>Sipariş durumunuzu sitemizdeki <a href='https://www.lamasperfume.com/kargotakip.html' style='color: #D4AF37; font-weight: bold; text-decoration: none;'>Sipariş Takip</a> sayfasından numaranızla sorgulayabilirsiniz.</p>");
            htmlMsg.append("<br><p>Güzel günlerde kullanmanız dileğiyle,<br><strong>Lamas Parfüm Ekibi</strong></p>");
            htmlMsg.append("</div>");

            helper.setText(htmlMsg.toString(), true);
            mailSender.send(mesaj);
        } catch (Exception e) {
            System.err.println("Sipariş maili hatası: " + e.getMessage());
        }
    }

    // =========================================================
    // 2. SİPARİŞ DURUM GÜNCELLEME MAİLİ (Kargoya Verildi vb.)
    // =========================================================
    public void siparisDurumMailiGonder(String musteriEmail, String musteriAd, String siparisNo, String yeniDurum) {
        try {
            MimeMessage mesaj = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mesaj, true, "UTF-8");

            // EKSİK OLAN HAYATİ SATIR EKLENDİ
            helper.setFrom("lamas@lamasperfume.com", "Lamas Parfüm");

            helper.setTo(musteriEmail);
            helper.setSubject("Sipariş Durumunuz Güncellendi - Lamas Parfüm");

            String htmlMsg = "<div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 25px; border-radius: 10px;'>"
                    + "<h2 style='color: #D4AF37; text-align: center; margin-top: 0;'>Siparişiniz Güncellendi</h2>"
                    + "<p>Merhaba <strong>" + musteriAd + "</strong>,</p>"
                    + "<p><strong>#" + siparisNo + "</strong> numaralı siparişinizin durumu güncellenmiştir.</p>"
                    + "<div style='background-color: #f6f1e8; padding: 15px; border-left: 4px solid #D4AF37; margin: 25px 0;'>"
                    + "<h3 style='margin: 0; color: #1a1a1a; font-weight: normal;'>Yeni Durum: <strong style='color: #D4AF37;'>" + yeniDurum + "</strong></h3>"
                    + "</div>"
                    + "<p>Kargo takibinizi sitemizdeki <a href='https://www.lamasperfume.com/kargotakip.html' style='color: #D4AF37; font-weight: bold; text-decoration: none;'>Sipariş Takip</a> sayfasından yapabilirsiniz.</p>"
                    + "<br><p>Bizi tercih ettiğiniz için teşekkür ederiz,<br><strong>Lamas Parfüm Ekibi</strong></p>"
                    + "</div>";

            helper.setText(htmlMsg, true);
            mailSender.send(mesaj);
        } catch (Exception e) {
            System.err.println("Durum maili hatası: " + e.getMessage());
        }
    }

    // =========================================================
    // 3. KAYIT ONAY KODU MAİLİ
    // =========================================================
    public void kayitOnayMailiGonder(String kime, String kod) {
        try {
            MimeMessage mesaj = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mesaj, true, "UTF-8");

            // EKSİK OLAN HAYATİ SATIR EKLENDİ
            helper.setFrom("lamas@lamasperfume.com", "Lamas Parfüm");

            helper.setTo(kime);
            helper.setSubject("Lamas Parfüm - Hesap Onay Kodunuz");

            String htmlMsg = "<div style='font-family: Arial, sans-serif; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eaeaea; padding: 30px; border-radius: 10px; text-align: center;'>"
                    + "<h2 style='color: #D4AF37; margin-top: 0;'>Lamas Dünyasına Hoş Geldiniz!</h2>"
                    + "<p style='font-size: 15px; margin-bottom: 30px;'>Hesabınızı aktif hale getirmek için güvenlik kodunuz aşağıdadır:</p>"
                    + "<div style='background-color: #f6f1e8; padding: 20px; margin: 0 auto; width: fit-content; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 5px; border: 2px dashed #D4AF37; color: #1a1a1a;'>"
                    + kod
                    + "</div>"
                    + "<p style='color: #777; font-size: 13px; margin-top: 30px;'>Lütfen bu kodu kayıt ekranına girerek üyeliğinizi tamamlayın.</p>"
                    + "</div>";

            helper.setText(htmlMsg, true);
            mailSender.send(mesaj);
        } catch (Exception e) {
            System.err.println("Kayıt onay maili hatası: " + e.getMessage());
        }
    }

    // =========================================================
    // 4. ŞİFRE SIFIRLAMA KODU MAİLİ
    // =========================================================
    public void sifreSifirlamaMailiGonder(String kime, String kod) {
        try {
            MimeMessage mesaj = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mesaj, true, "UTF-8");

            // EKSİK OLAN HAYATİ SATIR EKLENDİ
            helper.setFrom("lamas@lamasperfume.com", "Lamas Parfüm");

            helper.setTo(kime);
            helper.setSubject("Lamas Parfüm - Şifre Sıfırlama Kodunuz");

            String htmlMsg = "<div style='font-family: Arial, sans-serif; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eaeaea; padding: 30px; border-radius: 10px; text-align: center;'>"
                    + "<h2 style='color: #D4AF37; margin-top: 0;'>Şifre Sıfırlama Talebi</h2>"
                    + "<p style='font-size: 15px; margin-bottom: 30px;'>Şifrenizi unuttuğunuzu bildirdiniz. Yeni bir şifre belirlemek için kullanacağınız güvenlik kodu:</p>"
                    + "<div style='background-color: #f6f1e8; padding: 20px; margin: 0 auto; width: fit-content; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 5px; border: 2px dashed #D4AF37; color: #1a1a1a;'>"
                    + kod
                    + "</div>"
                    + "<p style='color: #777; font-size: 13px; margin-top: 30px;'>Eğer bu işlemi siz yapmadıysanız lütfen bu maili dikkate almayın veya bizimle iletişime geçin.</p>"
                    + "</div>";

            helper.setText(htmlMsg, true);
            mailSender.send(mesaj);
        } catch (Exception e) {
            System.err.println("Şifre sıfırlama maili hatası: " + e.getMessage());
        }
    }
}