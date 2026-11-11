package com.lamas.parfum.controller;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private static final String UPLOAD_DIR = "/var/www/photos/";

    @PostMapping
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Lütfen bir dosya seçin.");
        }

        try {
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // ... önceki kodlar (directory kontrolü vs.)

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            }

            String uniqueName = UUID.randomUUID().toString();
            String fullFileName = uniqueName + extension;

// 1. DÜZELTME: Sabit .jpg yerine orijinal uzantıyı (.webp) ekliyoruz
            String thumbFileName = uniqueName + "_thumb" + extension;

            Path originalPath = Paths.get(UPLOAD_DIR + fullFileName);
            Files.write(originalPath, file.getBytes());

            try {
                if (extension.equals(".jpg") || extension.equals(".jpeg") || extension.equals(".png") || extension.equals(".webp")) {
                    File thumbFile = new File(UPLOAD_DIR + thumbFileName);

                    Thumbnails.of(originalPath.toFile())
                            .size(500, 500)
                            // 2. DÜZELTME: Sabit "jpg" yerine uzantıyı (örneğin "webp") dinamik olarak veriyoruz
                            .outputFormat(extension.substring(1))
                            .outputQuality(0.85)
                            .toFile(thumbFile);
                }
            } catch (Exception thumbError) {
                System.out.println("Küçük resim üretilemedi: " + thumbError.getMessage());
            }

            return ResponseEntity.ok("photos/" + fullFileName);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Dosya sunucuya yazılamadı!");
        }
    }
}