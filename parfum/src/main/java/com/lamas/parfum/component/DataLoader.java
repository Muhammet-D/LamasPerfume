package com.lamas.parfum.component;

import com.lamas.parfum.model.Product;
import com.lamas.parfum.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final ProductRepository productRepository;

    public DataLoader(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Eğer veritabanında hiç ürün yoksa (boşsa), bu örnekleri ekle
        if (productRepository.count() == 0) {

            Product p1 = new Product();
            p1.setTitle("Lamas Red");
            p1.setDescription("İmza kokunuzu keşfedin. Gün boyu kalıcılık ve benzersiz ferahlık.");
            p1.setCategory("Colors");
            p1.setImgurl("photos/lamas-red.webp");
            p1.setPrice(1250.00);

            Product p2 = new Product();
            p2.setTitle("Kashmiri Oud");
            p2.setDescription("Oud ağacının büyüleyici ve gizemli dokunuşu.");
            p2.setCategory("Mix");
            p2.setImgurl("photos/kashmiri-oud.webp");
            p2.setPrice(1450.00);

            Product p3 = new Product();
            p3.setTitle("Yasemin Oda Kokusu");
            p3.setDescription("Evinizin havasını değiştiren doğal yasemin esintisi.");
            p3.setCategory("Oda Kokusu");
            p3.setImgurl("photos/yasemin-cubuk.webp");
            p3.setPrice(450.00);

            // Ürünleri veritabanına kaydet
            productRepository.save(p1);
            productRepository.save(p2);
            productRepository.save(p3);

            System.out.println("Örnek parfümler veritabanına başarıyla eklendi!");
        }
    }
}