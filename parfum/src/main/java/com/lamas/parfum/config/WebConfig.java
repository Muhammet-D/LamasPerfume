package com.lamas.parfum.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/photos/**")
                // Önce sunucudaki fiziki klasöre (ürün resimlerine),
                // sonra projenin içindeki statik klasöre (logolara) bakar
                .addResourceLocations("file:/var/www/photos/", "classpath:/static/photos/");
    }
}