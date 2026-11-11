package com.lamas.parfum.controller;

import com.lamas.parfum.component.CartItemRepository;
import com.lamas.parfum.model.CartItem;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartItemRepository cartItemRepository;

    public CartController(CartItemRepository cartItemRepository) {
        this.cartItemRepository = cartItemRepository;
    }

    // 1. Müşterinin Sepetini Getir
    @GetMapping("/{userId}")
    public List<CartItem> getCart(@PathVariable Long userId) {
        return cartItemRepository.findByUserId(userId);
    }

    // 2. Sepete Yeni Ürün Ekle (Varsa Adetini Artır)
    @PostMapping("/add")
    public CartItem addToCart(@RequestBody CartItem cartItem) {
        CartItem existingItem = cartItemRepository.findByUserIdAndProductIdAndSize(
                cartItem.getUserId(), cartItem.getProductId(), cartItem.getSize()
        );

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + cartItem.getQuantity());
            return cartItemRepository.save(existingItem);
        }
        return cartItemRepository.save(cartItem);
    }

    // 3. Sepetten Tek Bir Ürün Sil
    @DeleteMapping("/remove/{id}")
    public void removeCartItem(@PathVariable Long id) {
        cartItemRepository.deleteById(id);
    }

    // 4. Müşterinin Tüm Sepetini Sil (Satın alma bitince)
    @DeleteMapping("/clear/{userId}")
    public void clearCart(@PathVariable Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }
}