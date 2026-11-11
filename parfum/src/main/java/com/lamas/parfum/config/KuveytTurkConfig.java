package com.lamas.parfum.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class KuveytTurkConfig {

    // Dokümandaki Test (Sandbox) Bilgileri
    public static final String MERCHANT_ID = "891748";
    public static final String CUSTOMER_ID = "97678593";
    public static final String USER_NAME = "api4mami";
    public static final String PASSWORD = "290405";

    // 3D Secure 2.0 Test Adresleri
   // public static final String PAYGATE_URL = "https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelPayGate";
    // public static final String PROVISION_URL = "https://boatest.kuveytturk.com.tr/boa.virtualpos" +
        //    ".services/Home/ThreeDModelProvisionGate";

    // Canlıya alırken üsttekileri silip bunları kullan:
     public static final String PAYGATE_URL = "https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelPayGate";
     public static final String PROVISION_URL = "https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelProvisionGate";

    // Kendi domain adresini buraya girmelisin (Test için ngrok veya localhost kullanıyorsan onu yaz)
    public static final String CALLBACK_URL = "https://www.lamasperfume.com/api/kuveytturk/callback";
}