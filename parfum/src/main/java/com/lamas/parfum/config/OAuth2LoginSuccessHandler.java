package com.lamas.parfum.config;

import com.lamas.parfum.model.User;
import com.lamas.parfum.component.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.Optional;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String fullName = oAuth2User.getAttribute("name");

        // Ad ve soyadı ayıralım
        String name = "Misafir";
        String surname = "Müşteri";
        if (fullName != null) {
            String[] parts = fullName.split(" ");
            surname = parts.length > 1 ? parts[parts.length - 1] : "";
            StringBuilder nameBuilder = new StringBuilder();
            for (int i = 0; i < parts.length - 1; i++) {
                nameBuilder.append(parts[i]).append(" ");
            }
            name = nameBuilder.length() > 0 ? nameBuilder.toString().trim() : parts[0];
        }

        // 🌟 KIRMIZI ÇİZGİ HATASININ ÇÖZÜMÜ (Optional Kullanımı)
        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isEmpty()) {
            // Kullanıcı veritabanında yoksa yeni kayıt oluştur
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setSurname(surname);
            user.setPassword("OAUTH_GOOGLE_LOGIN");
            userRepository.save(user);
        } else {
            // Kullanıcı veritabanında zaten varsa mevcut olanı al
            user = userOptional.get();
        }

        // Frontend'e hem adı soyadı hem de veritabanındaki gerçek ID'yi gönderiyoruz
        String frontendYonlendirme = "/giris.html?oauth=success&email=" + email + "&name=" + URLEncoder.encode(name + " " + surname, "UTF-8") + "&id=" + user.getId();
        getRedirectStrategy().sendRedirect(request, response, frontendYonlendirme);
    }
}