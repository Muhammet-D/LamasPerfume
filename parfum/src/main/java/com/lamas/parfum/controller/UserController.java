package com.lamas.parfum.controller;

import com.lamas.parfum.component.UserRepository;
import com.lamas.parfum.model.User;
import com.lamas.parfum.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private EmailService emailService;

    // --- 1. AKILLI KAYIT OLMA (Yenilenmiş) ---
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User newUser) {

        // 6 Haneli Rastgele Doğrulama Kodu Üret
        String randomCode = String.format("%06d", new java.util.Random().nextInt(999999));

        // Veritabanında bu mail adresiyle bir kullanıcı var mı diye bakıyoruz
        Optional<User> existingUserOpt = userRepository.findByEmail(newUser.getEmail());

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();

            // Eğer hesap VAR ve ONAYLIYSA kaydı durdur.
            if (existingUser.isVerified()) {
                return ResponseEntity.badRequest().body("Hata: Bu email adresi zaten kullanılıyor!");
            } else {
                // HESAP VAR AMA ONAYLANMAMIŞ! (Senin bahsettiğin senaryo)
                // Kullanıcının bilgilerini güncelliyoruz ve yeni kod yolluyoruz.
                existingUser.setName(newUser.getName());
                existingUser.setSurname(newUser.getSurname());
                existingUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
                existingUser.setVerificationCode(randomCode);

                userRepository.save(existingUser);
                emailService.kayitOnayMailiGonder(existingUser.getEmail(), randomCode);

                return ResponseEntity.ok("Kayıt güncellendi. Lütfen e-postanıza gönderilen YENİ doğrulama kodunu giriniz.");
            }
        }

        // EĞER HESAP HİÇ YOKSA (Yepyeni Kayıt)
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        newUser.setRole("USER");
        newUser.setVerified(false);
        newUser.setVerificationCode(randomCode);

        userRepository.save(newUser);
        emailService.kayitOnayMailiGonder(newUser.getEmail(), randomCode);

        return ResponseEntity.ok("Kayıt başarılı. Lütfen e-postanıza gönderilen kodu giriniz.");
    }

    // --- 2. KODU ONAYLAMA (Yeni Endpoint) ---
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String email, @RequestParam String code) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null && user.getVerificationCode().equals(code)) {
            user.setVerified(true); // Hesabı aktif et
            user.setVerificationCode(null); // Kodu temizle ki tekrar kullanılmasın
            userRepository.save(user);
            return ResponseEntity.ok("Hesabınız başarıyla onaylandı. Giriş yapabilirsiniz.");
        }
        return ResponseEntity.badRequest().body("Hata: Kod yanlış veya süresi dolmuş.");
    }

    // --- 3. GİRİŞ YAPMA (Akıllı Onay Yönlendirmeli) ---
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail()).orElse(null);

        if (user != null) {
            // ÖNCE GÜVENLİK: Şifre doğru mu?
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                return ResponseEntity.status(401).body("Hata: Email veya şifre yanlış!");
            }

            // ŞİFRE DOĞRU AMA HESAP ONAYSIZ! (Senin Senaryon)
            if (!user.isVerified()) {
                // Yeni kod üret, kaydet ve anında maile gönder
                String randomCode = String.format("%06d", new java.util.Random().nextInt(999999));
                user.setVerificationCode(randomCode);
                userRepository.save(user);
                emailService.kayitOnayMailiGonder(user.getEmail(), randomCode);

                return ResponseEntity.status(403).body("Hesabınız henüz onaylanmamış. E-postanıza YENİ bir onay kodu gönderdik!");
            }

            // Şifre doğru, hesap onaylı. İçeri al!
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(401).body("Hata: Email veya şifre yanlış!");
    }
    // --- 4. ŞİFREMİ UNUTTUM ---
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            String resetCode = String.format("%06d", new java.util.Random().nextInt(999999));
            user.setResetCode(resetCode);
            user.setResetCodeExpiry(LocalDateTime.now().plusMinutes(3));
            userRepository.save(user);

            emailService.sifreSifirlamaMailiGonder(user.getEmail(), resetCode);
            return ResponseEntity.ok("Şifre sıfırlama kodu email adresinize gönderildi.");
        }
        return ResponseEntity.badRequest().body("Hata: Sistemde böyle bir email bulunamadı.");
    }

    // --- 5. YENİ ŞİFREYİ BELİRLEME ---
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String email, @RequestParam String code, @RequestParam String newPassword) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null && user.getResetCode() != null && user.getResetCode().equals(code)) {

            if (LocalDateTime.now().isAfter(user.getResetCodeExpiry())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Hata: Kodun süresi dolmuş. Lütfen yeni bir kod isteyin.");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setResetCode(null);
            user.setResetCodeExpiry(null);
            userRepository.save(user);
            return ResponseEntity.ok("Şifreniz başarıyla değiştirildi.");
        }
        else {
            return ResponseEntity.badRequest().body("Hata: Doğrulama kodu yanlış.");
        }
    }
    // 3. KULLANICI BİLGİLERİNİ CANLI ÇEKME (YENİ EKLENEN API)
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    // 4. KULLANICININ ADRESİNİ GÜNCELLEME
    @PutMapping("/{id}/address")
    public ResponseEntity<?> updateAddress(@PathVariable Long id, @RequestBody User updatedInfo) {
        User user = userRepository.findById(id).orElse(null);
        if(user != null) {
            user.setPhone(updatedInfo.getPhone());
            user.setCity(updatedInfo.getCity());
            user.setDistrict(updatedInfo.getDistrict()); // İLÇE BURAYA EKLENDİ
            user.setAddress(updatedInfo.getAddress());
            userRepository.save(user);
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.badRequest().body("Kullanıcı bulunamadı");
    }

    // --- YARDIMCI SINIF (DTO) ---
    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}