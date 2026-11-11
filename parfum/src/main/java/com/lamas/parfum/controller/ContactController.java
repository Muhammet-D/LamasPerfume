package com.lamas.parfum.controller;

import com.lamas.parfum.model.ContactMessage;
import com.lamas.parfum.component.ContactMessageRepository;
import com.lamas.parfum.service.TelegramNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    @Autowired
    private ContactMessageRepository contactRepository;
    @Autowired
    private TelegramNotificationService telegramNotificationService;

    // Mesaj GÖNDERMEK için (Zaten vardı)
    @PostMapping("/send")
    public ResponseEntity<String> sendMessage(@RequestBody ContactMessage message) {
        try {
            // 1. Veritabanına kaydet
            ContactMessage savedMessage = contactRepository.save(message);

            // 2. Telegram üzerinden patrona (size) anlık bildirim fırlat
            String telegramMesaj = "📩 *Yeni İletişim Mesajı Var!*\n\n" +
                    "👤 *Gönderen:* " + savedMessage.getName() + "\n" +
                    "📧 *E-posta:* " + savedMessage.getEmail() + "\n" +
                    "📌 *Konu:* " + savedMessage.getSubject() + "\n" +
                    "💬 *Mesaj:* " + savedMessage.getMessage();

            telegramNotificationService.mesajGonder(telegramMesaj);

            return ResponseEntity.ok("Mesaj başarıyla iletildi.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Hata: " + e.getMessage());
        }
    }

    // YENİ: Admin panelinde tüm mesajları OKUMAK için
    @GetMapping("/all")
    public List<ContactMessage> getAllMessages() {
        return contactRepository.findAll();
    }
}