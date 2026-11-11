package com.lamas.parfum.controller;

import com.lamas.parfum.component.CommentRepository;
import com.lamas.parfum.model.Comment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {
@Autowired
    private CommentRepository commentRepository;

@PostMapping("/add")
    public ResponseEntity<String> addComment (@RequestBody Comment newComment){
    try {
        commentRepository.save(newComment);
        return ResponseEntity.ok("Yorum başarıyla gönderildi.");
    }catch (Exception e){
        return  ResponseEntity.internalServerError().body("Yorum kaydedilemedi");
    }
    }


    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Comment>> getCommentsByProduct(@PathVariable Long productId){
    List<Comment> urunYorumlari = commentRepository.findByProductId(productId);

    return ResponseEntity.ok(urunYorumlari);
    }
}
