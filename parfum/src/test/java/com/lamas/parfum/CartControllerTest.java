package com.lamas.parfum;

import com.lamas.parfum.component.CartItemRepository;
import com.lamas.parfum.controller.CartController;
import com.lamas.parfum.model.CartItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CartControllerTest {

    @Mock
    private CartItemRepository cartItemRepository;

    @InjectMocks
    private CartController cartController;

    private CartItem sampleCartItem;

    @BeforeEach
    void setUp() {
        // Test için sanal bir sepet ürünü
        sampleCartItem = new CartItem();
        sampleCartItem.setId(1L);
        sampleCartItem.setUserId(99L);
        sampleCartItem.setProductId(101L);
        sampleCartItem.setTitle("Lamas Black");
        sampleCartItem.setSize("100ML");
        sampleCartItem.setPrice(1250.0);
        sampleCartItem.setQuantity(1);
    }


    @Test
    void addToCart_WhenItemDoesNotExist_ShouldCreateNewItem() {
        //Aynı ürün ve aynı boyutta bir ürün sepette yok (null dönüyor)
        when(cartItemRepository.findByUserIdAndProductIdAndSize(anyLong(), anyLong(), anyString())).thenReturn(null);
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(sampleCartItem);

        //Ürünü sepete ekle
        CartItem result = cartController.addToCart(sampleCartItem);

        // Doğrulama: Yeni bir satır oluşturulmalı ve adet 1 olmalı
        assertNotNull(result);
        assertEquals(1, result.getQuantity());
        verify(cartItemRepository, times(1)).save(sampleCartItem);
    }

    @Test
    void addToCart_WhenItemAlreadyExists_ShouldIncreaseQuantity() {
        // Aynı ürün sepette zaten var (Önceki siparişten)
        CartItem existingItem = new CartItem();
        existingItem.setQuantity(2); // Önceden 2 adet eklenmiş olsun
        existingItem.setPrice(1250.0);

        when(cartItemRepository.findByUserIdAndProductIdAndSize(99L, 101L, "100ML")).thenReturn(existingItem);
        when(cartItemRepository.save(existingItem)).thenReturn(existingItem);

        //Aynı üründen 1 adet daha sepete ekle
        CartItem result = cartController.addToCart(sampleCartItem);

        // Doğrulama: Yeni bir satır açmak YERİNE, önceki satırın miktarını 2 + 1 = 3 yapmalı
        assertNotNull(result);
        assertEquals(3, result.getQuantity());
        verify(cartItemRepository, times(1)).save(existingItem);
    }



    @Test
    void getCart_ShouldReturnUserCartItems() {
        //Müşterinin sepetinde 2 ürün var
        List<CartItem> expectedCart = Arrays.asList(sampleCartItem, new CartItem());
        when(cartItemRepository.findByUserId(99L)).thenReturn(expectedCart);

        //Sepeti getir
        List<CartItem> actualCart = cartController.getCart(99L);

        // Doğrulama: Gelen ürün sayısı eşleşiyor mu?
        assertEquals(2, actualCart.size());
        verify(cartItemRepository, times(1)).findByUserId(99L);
    }

    @Test
    void clearCart_ShouldDeleteAllUserCartItems() {
        //Satın alma işlemi bittikten sonra sepeti temizle
        cartController.clearCart(99L);

        // Doğrulama: Sepet temizleme metodunun tam olarak bir kez tetiklendiğini kontrol et
        verify(cartItemRepository, times(1)).deleteByUserId(99L);
    }
}