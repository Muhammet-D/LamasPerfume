package com.lamas.parfum.model;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {
@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

private Long id;
private String title;
private String description;
private String category;
private String imgurl;
private String secondImgUrl;
private String sizes;
private String sizePrices;
private String gender;
private Integer stock =100;
private String topNotes;
private String middleNotes;

    public String getBaseNotes() {
        return baseNotes;
    }

    public void setBaseNotes(String baseNotes) {
        this.baseNotes = baseNotes;
    }

    public String getMiddleNotes() {
        return middleNotes;
    }

    public void setMiddleNotes(String middleNotes) {
        this.middleNotes = middleNotes;
    }

    public String getTopNotes() {
        return topNotes;
    }

    public void setTopNotes(String topNotes) {
        this.topNotes = topNotes;
    }

    private String baseNotes;

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    private double price;
    @Column(name = "video_url")
    private String videoUrl;


    public String getSizePrices() {
        return sizePrices;
    }
    public void setSizePrices(String sizePrices) {
        this.sizePrices = sizePrices;
    }


    public String getSecondImgUrl() {
        return secondImgUrl;
    }

    public void setSecondImgUrl(String secondImgUrl) {
        this.secondImgUrl = secondImgUrl;
    }
    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }
    public String getSizes() {
        return sizes;
    }

    public void setSizes(String sizes) {
        this.sizes = sizes;
    }
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String desc) {
        this.description = desc;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImgurl() {
        return imgurl;
    }

    public void setImgurl(String imgurl) {
        this.imgurl = imgurl;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }
}
