package com.lamas.parfum;

import com.lamas.parfum.component.UserRepository;
import com.lamas.parfum.controller.UserController;
import com.lamas.parfum.model.User;
import com.lamas.parfum.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserControlerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserController userController;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("test@lamasperfume.com");
        testUser.setName("Lamas");
        testUser.setSurname("Tester");
        testUser.setPassword("securePassword123");
    }

    @Test
    void registerUser_WhenEmailAlreadyExistsAndVerified_ShouldReturnBadRequest() {
        testUser.setVerified(true);
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        ResponseEntity<?> response = userController.registerUser(testUser);


        assertEquals(400, response.getStatusCode().value());
        assertEquals("Hata: Bu email adresi zaten kullanılıyor!", response.getBody());

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_WhenEmailExistsButNotVerified_ShouldUpdateUserAndResendCode() {
        testUser.setVerified(false);
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");

        ResponseEntity<?> response = userController.registerUser(testUser);


        assertEquals(200, response.getStatusCode().value());
        assertEquals("Kayıt güncellendi. Lütfen e-postanıza gönderilen YENİ doğrulama kodunu giriniz.", response.getBody());

        verify(userRepository, times(1)).save(testUser);
        verify(emailService, times(1)).kayitOnayMailiGonder(eq(testUser.getEmail()), anyString());
    }

    @Test
    void registerUser_WhenNewUser_ShouldHashPasswordAndSave() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(testUser.getPassword())).thenReturn("hashedPassword");

        ResponseEntity<?> response = userController.registerUser(testUser);


        assertEquals(200, response.getStatusCode().value());
        assertEquals("Kayıt başarılı. Lütfen e-postanıza gönderilen kodu giriniz.", response.getBody());

        assertEquals("hashedPassword", testUser.getPassword());
        assertEquals("USER", testUser.getRole());
        assertFalse(testUser.isVerified());
        assertNotNull(testUser.getVerificationCode());

        verify(userRepository, times(1)).save(testUser);
        verify(emailService, times(1)).kayitOnayMailiGonder(eq(testUser.getEmail()), anyString());
    }
}