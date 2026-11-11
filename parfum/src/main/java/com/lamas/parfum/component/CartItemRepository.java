package com.lamas.parfum.component;

import com.lamas.parfum.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.transaction.Transactional;
import java.util.List;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByUserId(Long userId);

    CartItem findByUserIdAndProductIdAndSize(Long userId, Long productId, String size);

    @Transactional
    void deleteByUserId(Long userId);
}