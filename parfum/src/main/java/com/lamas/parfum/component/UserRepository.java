package com.lamas.parfum.component;

import com.lamas.parfum.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Giriş yaparken müşteriyi email adresinden bulmamızı sağlayacak özel metod
    Optional<User> findByEmail(String email);

    // Kayıt olurken bu email daha önce kullanılmış mı diye kontrol etmek için
    boolean existsByEmail(String email);
}