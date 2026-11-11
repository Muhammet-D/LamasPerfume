package com.lamas.parfum.controller;

import com.lamas.parfum.model.Product;
import com.lamas.parfum.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin
public class ProductController {
private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getAllProducts(){
        return productRepository.findAll();
    }
    @PostMapping
    public Product addProduct (@RequestBody Product yeniUrun){
        return productRepository.save(yeniUrun);
    }
    @DeleteMapping("/{id}")
    public void deleteProduct (@PathVariable Long id){
        productRepository.deleteById(id);
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product guncelUrun) {
        return productRepository.findById(id).map(mevcutUrun -> {
            // Veritabanındaki mevcut ürünü yeni gelen verilerle güncelliyoruz
            mevcutUrun.setTitle(guncelUrun.getTitle());
            mevcutUrun.setDescription(guncelUrun.getDescription());
            mevcutUrun.setPrice(guncelUrun.getPrice());
            mevcutUrun.setCategory(guncelUrun.getCategory());
            mevcutUrun.setImgurl(guncelUrun.getImgurl());
            mevcutUrun.setVideoUrl(guncelUrun.getVideoUrl());
            mevcutUrun.setSecondImgUrl(guncelUrun.getSecondImgUrl());
            mevcutUrun.setSizes(guncelUrun.getSizes());
            mevcutUrun.setSizePrices(guncelUrun.getSizePrices());
            mevcutUrun.setGender(guncelUrun.getGender());
            mevcutUrun.setTopNotes(guncelUrun.getTopNotes());
            mevcutUrun.setMiddleNotes(guncelUrun.getMiddleNotes());
            mevcutUrun.setBaseNotes(guncelUrun.getBaseNotes());

            if (guncelUrun.getStock() != null) {
                mevcutUrun.setStock(guncelUrun.getStock());
            } else {
                mevcutUrun.setStock(100); // Boş gelirse 100 yap
            }

            // Güncellenmiş nesneyi veritabanına yazıyoruz
            productRepository.save(mevcutUrun);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id).orElse(null);
    }
}
