package com.lamas.parfum.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // YENİ: Başarılı sosyal girişi yakalayacak sınıfımızı bağlıyoruz
    @Autowired
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    // 1. ŞİFRELEME MOTORUMUZ (BCrypt)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. GÜVENLİK DUVARI AYARLARI
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                )
                // YENİ: Google ve Apple OAuth2 Giriş Ayarları
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/giris.html") // Kendi lüks giriş sayfamıza yönlendirir
                        .successHandler(oAuth2LoginSuccessHandler) // Giriş başarılıysa handler sınıfını çalıştırır
                );
        return http.build();
    }

}