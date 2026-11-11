package com.lamas.parfum.component;


import com.lamas.parfum.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.transaction.Transactional;
import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(Long userId);
    Favorite findByUserIdAndProductId(Long userId, Long productId);

    @Transactional
    void deleteByUserIdAndProductId(Long userId, Long productId);
    List<Favorite> findAllByUserIdAndProductId(Long userId, Long productId);
}