package com.lamas.parfum.controller;
import com.lamas.parfum.component.FavoriteRepository;
import com.lamas.parfum.model.Favorite;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;

    public FavoriteController(FavoriteRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    // Kullanıcının tüm favorilerini getir
    @GetMapping("/{userId}")
    public List<Favorite> getFavorites(@PathVariable Long userId) {
        return favoriteRepository.findByUserId(userId);
    }

    @PostMapping("/toggle")
    public void toggleFavorite(@RequestBody Favorite favorite) {

        // Bu adamın bu ürüne ait ne kadar favori kaydı varsa hepsini getir
        List<Favorite> existingFavorites = favoriteRepository.findAllByUserIdAndProductId(favorite.getUserId(),
                favorite.getProductId());

        if (!existingFavorites.isEmpty()) {
            // Zaten ekliyse (hatta kopya bile varsa) hepsini DB'den sil temizle!
            favoriteRepository.deleteAll(existingFavorites);
        } else {
            // Ekli değilse DB'ye 1 tane kaydet
            favoriteRepository.save(favorite);
        }
    }
}