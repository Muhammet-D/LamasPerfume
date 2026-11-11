// =======================================================
// 0. LAMAS PROFESYONEL BİLDİRİM MOTORU (TOAST MESSAGES)
// =======================================================
window.lamasBildirim = function(mesaj, tur = "bilgi") {
    let toast = document.createElement("div");

    // Tema Renkleri ve İkonları
    let renk = "#D4AF37"; // Varsayılan Lamas Altını (Başarılı ve Bilgi)
    let ikon = "fa-circle-info";

    if (tur === "hata") {
        renk = "#e74c3c"; // Kırmızı
        ikon = "fa-circle-xmark";
    } else if (tur === "basarili") {
        renk = "#D4AF37"; // Altın Sarısı
        ikon = "fa-circle-check";
    } else if (tur === "uyari") {
        renk = "#f39c12"; // Turuncu
        ikon = "fa-triangle-exclamation";
    }

    // Bildirim Kutusunun Tasarımı (Lüks Tema)
    toast.style.position = "fixed";
    toast.style.top = "25px";
    toast.style.right = "-400px";
    toast.style.width = "320px";
    toast.style.backgroundColor = "#1A1A1A";
    toast.style.color = "#F6F1E8";
    toast.style.padding = "16px 20px";
    toast.style.borderRadius = "8px";
    toast.style.borderLeft = `5px solid ${renk}`;
    toast.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "15px";
    toast.style.fontFamily = "sans-serif";
    toast.style.fontSize = "14px";
    toast.style.lineHeight = "1.4";
    toast.style.zIndex = "9999999";
    toast.style.transition = "right 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)";

    toast.innerHTML = `<i class="fa-solid ${ikon}" style="color: ${renk}; font-size: 24px;"></i> <span>${mesaj}</span>`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.right = "25px";
    }, 50);

    setTimeout(() => {
        toast.style.right = "-400px";
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3500);
};

// =======================================================
// GLOBAL DEĞİŞKENLER (SADECE BİR KERE TANIMLANDILAR)
// =======================================================
let vitrinUrunleri = [];
let currentIndex = 0;
let isAnimating = false;
let duzenlenenUrunId = null;
let sayi = 1;
let secilenBoyut = "Standart Boy";

// =======================================================
// SAYFA YÜKLENDİĞİNDE ÇALIŞACAK TÜM MOTORLAR (TEK BİR YERDE)
// =======================================================
document.addEventListener("DOMContentLoaded", () => {

    // --- 1. SİSTEMİ ÇALIŞTIRAN ANA FONKSİYONLAR ---
    window.sepetSayaciniGuncelle();
    vitriniVeritabanindanGetir();
    parfumeriGetir();
    adminUrunleriGetir();
    adminSiparisleriGetir();
    adminMesajlariGetir();

    // --- MÜŞTERİ GİRİŞ YAPMIŞSA SEPET VE FAVORİLERİ JAVA'DAN ÇEK ---
    if(JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"))) {
        setTimeout(() => {
            if(typeof window.sepetiSunucuylaSenkronizeEt === "function") window.sepetiSunucuylaSenkronizeEt();
            if(typeof window.favorileriSunucuylaSenkronizeEt === "function") window.favorileriSunucuylaSenkronizeEt();
        }, 300);
    }

    // ÇÖZÜM 1: urlParams'ı sadece 1 defa burada tanımlıyoruz! Diğer heryerde bu değişkeni kullanacağız.
    let urlParams = new URLSearchParams(window.location.search);
    let urunId = urlParams.get("id");

    // --- 2. URUN.HTML: Ürün Detaylarını ve Dinamik Boyutları Çekme ---
    if (urunId) {
        fetch("/api/products/" + urunId)
            .then(response => response.json())
            .then(parfum => {
                let urunBaslik = document.getElementById("urun-baslik");
                            if(urunBaslik) {
                                urunBaslik.innerText = parfum.title;
                                urunBaslik.setAttribute("data-orijinal-resim", parfum.imgurl); // <--- BU SATIRI EKLE
                            }
                            if(document.getElementById("urun-fiyat")) document.getElementById("urun-fiyat").innerText = parfum.price + "₺";
                if(document.getElementById("urun-detay-aciklama")) document.getElementById("urun-detay-aciklama").innerText = parfum.description;
                if(document.getElementById("akordiyon-aciklama")) document.getElementById("akordiyon-aciklama").innerText = parfum.description;

              // 🌟 VİDEO DESTEKLİ LÜKS GALERİ MOTORU
                              window.aktifMedya = []; // Artık sadece link değil, türünü de tutacağız (resim/video)
                              window.aktifFotoIndex = 0;

                              // 1. FOTOĞRAFLARI EKLE
                              if (parfum.category === "Oda Kokusu") {
                                  let gosterilecekFoto = (parfum.secondImgUrl && parfum.secondImgUrl.trim() !== "") ? parfum.secondImgUrl : parfum.imgurl;
                                  window.aktifMedya.push({ tur: 'resim', url: gosterilecekFoto });
                              } else {
                                  window.aktifMedya.push({ tur: 'resim', url: parfum.imgurl });
                                  if (parfum.secondImgUrl && parfum.secondImgUrl.trim() !== "") {
                                      window.aktifMedya.push({ tur: 'resim', url: parfum.secondImgUrl });
                                  }
                              }

                              // 2. VİDEOYU EKLE (En sona 3. olarak gelir)
                              if (parfum.videoUrl && parfum.videoUrl.trim() !== "") {
                                  window.aktifMedya.push({ tur: 'video', url: parfum.videoUrl });
                              }

                              let solBtn = document.getElementById("solFotoBtn");
                              let sagBtn = document.getElementById("sagFotoBtn");

                              // İlk medyayı (1. Fotoğrafı) ekrana bas
                              if (window.aktifMedya.length > 0) {
                                  window.medyayiGoster(0);
                              }

                              // Birden fazla medya varsa okları aç
                              if (window.aktifMedya.length > 1) {
                                  if (solBtn) solBtn.style.display = "flex";
                                  if (sagBtn) sagBtn.style.display = "flex";
                              } else {
                                  if (solBtn) solBtn.style.display = "none";
                                  if (sagBtn) sagBtn.style.display = "none";
                              }
                let bedenKutusu = document.getElementById("beden-secenekleri");
                if (bedenKutusu) {
                    bedenKutusu.innerHTML = "";

                    let gelenBedenler = parfum.sizes ? parfum.sizes : "Standart Boy";
                    let bedenListesi = gelenBedenler.split(",");
                    let gelenFiyatlar = parfum.sizePrices ? parfum.sizePrices : parfum.price.toString();
                    let fiyatListesi = gelenFiyatlar.split(",");

                    bedenListesi.forEach((bedenYazisi, index) => {
                        let btn = document.createElement("button");
                        btn.className = "showcase-btn";
                        btn.innerText = bedenYazisi.trim();
                        btn.style.fontSize = "13px";
                        btn.style.width = "50px";
                        btn.style.height = "30px";
                        btn.style.textAlign = "center";
                        btn.style.display = "flex";
                        btn.style.alignItems = "center";
                        btn.style.justifyContent = "center";
                        btn.style.transition = "all 0.3s";

                        if(index === 0) {
                            btn.style.backgroundColor = "#D4AF37";
                            btn.style.color = "white";
                            secilenBoyut = btn.innerText;

                            let ilkFiyat = fiyatListesi[0] ? fiyatListesi[0].trim() : parfum.price;
                            if(document.getElementById("urun-fiyat")) {
                                document.getElementById("urun-fiyat").innerText = parseFloat(ilkFiyat).toLocaleString('tr-TR') + "₺";
                            }
                        }

                      btn.addEventListener("click", function() {
                                                  let tumButonlar = bedenKutusu.querySelectorAll("button");
                                                  tumButonlar.forEach(b => {
                                                      b.style.backgroundColor = "transparent";
                                                      b.style.color = "black";
                                                  });
                                                  this.style.backgroundColor = "#D4AF37";
                                                  this.style.color = "white";
                                                  secilenBoyut = this.innerText;

                                                  // 1. Fiyatı Güncelle
                                                  let secilenFiyat = fiyatListesi[index] ? fiyatListesi[index].trim() : fiyatListesi[0].trim();
                                                  if(document.getElementById("urun-fiyat")) {
                                                      document.getElementById("urun-fiyat").innerText = parseFloat(secilenFiyat).toLocaleString('tr-TR') + "₺";
                                                  }

                                                  // 2. FOTOĞRAFI GÜNCELLE (SADECE "Mix" KATEGORİSİ İÇİN)
                                                  let detayFoto = document.getElementById("urun-detay-foto");

                                                  // Eğer ürün "Mix" kategorisindeyse bu işlemi yap
                                                  if (detayFoto && parfum.category === "Mix") {
                                                      // 50ML seçildiyse ve ürünün 2. fotoğrafı varsa onu göster
                                                      if (secilenBoyut.includes("50") && parfum.secondImgUrl) {
                                                          detayFoto.src = parfum.secondImgUrl;
                                                      }
                                                      // Diğer durumlarda (veya 100ML seçildiyse) ana fotoğrafı göster
                                                      else {
                                                          detayFoto.src = parfum.imgurl;
                                                      }
                                                  }
                                              });

                        bedenKutusu.appendChild(btn);
                    });
                }

                let favoriler = JSON.parse(localStorage.getItem("lamasFavoriler")) || [];
                let favoriMi = favoriler.find(f => f.id == parfum.id);
                let kalpClass = favoriMi ? "fa-solid" : "fa-regular";
                let kalpRenk = favoriMi ? "#D4AF37" : "#777";

                let favBtn = document.getElementById("urun-fav-btn");
                if (favBtn) {
                    favBtn.setAttribute("data-id", parfum.id);
                    favBtn.setAttribute("data-title", parfum.title.replace(/"/g, '&quot;'));
                    favBtn.setAttribute("data-img", parfum.imgurl);
                    favBtn.setAttribute("data-price", parfum.price);
                    favBtn.innerHTML = `<i class="${kalpClass} fa-heart" style="color: ${kalpRenk}; font-size: 20px; transition: all 0.3s;"></i>`;
                }
// --- KATEGORİYE GÖRE "NOTALAR" SEKMESİNİ GÖSTER/GİZLE ---
                    // --- KATEGORİYE GÖRE "NOTALAR" SEKMESİNİ GÖSTER/GİZLE VE DİNAMİK DOLDUR ---
                    let notalarSekmesi = document.getElementById("notalar-sekmesi");

                    if (notalarSekmesi) {
                        // Ürün 'Colors' veya 'Mix' ise
                        if (parfum.category === "Colors" || parfum.category === "Mix" ||parfum.category === "Muadil") {

                            let notalarIcerik = document.querySelector("#notalar-sekmesi .accordion-content p");

                            if (notalarIcerik) {
                                let htmlIcerik = ""; // Başlangıçta boş bir kutu oluşturuyoruz

                                // Eğer veritabanında "topNotes" varsa ve boş değilse, HTML kutusuna ekle
                                if (parfum.topNotes && parfum.topNotes.trim() !== "") {
                                    htmlIcerik += `<strong>Üst Notalar:</strong> ${parfum.topNotes}<br>`;
                                }

                                // Eğer "middleNotes" varsa ekle
                                if (parfum.middleNotes && parfum.middleNotes.trim() !== "") {
                                    htmlIcerik += `<strong style="margin-top: 5px; display: inline-block;">Orta Notalar:</strong> ${parfum.middleNotes}<br>`;
                                }

                                // Eğer "baseNotes" varsa ekle
                                if (parfum.baseNotes && parfum.baseNotes.trim() !== "") {
                                    htmlIcerik += `<strong style="margin-top: 5px; display: inline-block;">Alt Notalar:</strong> ${parfum.baseNotes}`;
                                }

                                // KONTROL: Eğer hiçbir nota bilgisi girilmemişse sekme boş kalmasın, tamamen gizlensin
                                if (htmlIcerik === "") {
                                    notalarSekmesi.style.display = "none";
                                } else {
                                    notalarIcerik.innerHTML = htmlIcerik; // Oluşturduğumuz metni p etiketinin içine basıyoruz
                                    notalarSekmesi.style.display = "block"; // Ve sekmeyi görünür yapıyoruz
                                }
                            }
                        }
                        else {
                            // Parfüm değilse (Oda kokusu vb.) tamamen gizle
                            notalarSekmesi.style.display = "none";
                        }
                    }
                    // --- 🌟 KULLANIM ÖNERİSİNİ KATEGORİYE GÖRE DEĞİŞTİRME ---
                                    let kullanimOnerisiMetni = document.getElementById("kullanim-onerisi-metni");

                                    if (kullanimOnerisiMetni && parfum.category) {
                                        let oneriMetni = "";

                                        if (parfum.category === "Colors" || parfum.category === "Mix") {
                                            oneriMetni = "Temiz tene, özellikle nabız noktalarına (boyun, bilek içleri, kulak arkası) 15-20 cm mesafeden püskürterek uygulayınız. Esansın kalıcılığını koruması için sıktıktan sonra ovalamayınız, kendi halinde kurumasına izin veriniz.";
                                        }
                                        else if (parfum.category === "Vucut Spreyi") {
                                            oneriMetni = "Duş sonrasında veya gün içinde ihtiyaç duyduğunuz her an temiz teninize 15 cm mesafeden bolca püskürterek tüm vücudunuza uygulayabilirsiniz. Ferahlık hissini gün boyu tazeler.";
                                        }
                                        else if (parfum.category === "Oda Kokusu") {
                                            // Çubuklu oda kokusu
                                            oneriMetni = "Şişenin tıpasını açtıktan sonra bambu çubukları içine yerleştirin. Kokunun ortama homojen yayılması için çubukları haftada 1-2 kez ters çevirmeniz tavsiye edilir. Koku yoğunluğunu çubuk sayısını azaltıp artırarak ayarlayabilirsiniz.";
                                        }
                                        else if (parfum.category === "Oda Spreyi") {
                                            oneriMetni = "Bulunduğunuz ortamın havasını anında değiştirmek için odanın merkezine doğru havaya 2-3 kez püskürtün. Gıdalardan uzak tutunuz ve hassas kumaşlara çok yakından sıkmaktan kaçınınız.";
                                        }
                                        else {
                                            // Belirtilmeyen bir kategori gelirse standart metin
                                            oneriMetni = "Ürünü ambalajı üzerinde belirtilen talimatlara uygun şekilde kullanınız.";
                                        }

                                        kullanimOnerisiMetni.innerHTML = oneriMetni;
                                    }
                                    // -------------------------------------------------------------
                // --- STOK KONTROLÜ VE BUTON KİLİTLEME MOTORU ---
                                   let sepeteEkleBtn = document.querySelector('.add-cart-btn');
                                   let hemenSatinAlBtn = document.querySelector('.buy-btn');

                                   if (parfum.stock <= 0) {
                                       // Stok bittiyse Müşteriyi Uyar ve Butonları Kilitle!
                                       if (sepeteEkleBtn) {
                                           sepeteEkleBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Tükendi';
                                           sepeteEkleBtn.style.backgroundColor = "#777"; // Rengini gri yap
                                           sepeteEkleBtn.style.cursor = "not-allowed"; // Farenin şeklini değiştir
                                           sepeteEkleBtn.disabled = true; // Tıklamayı tamamen iptal et
                                       }
                                       if (hemenSatinAlBtn) {
                                           hemenSatinAlBtn.style.display = "none"; // Hemen al butonunu tamamen gizle
                                       }
                                       lamasBildirim("Bu ürünün stoğu maalesef tükenmiştir.", "uyari");
                                   }

                                // =======================================================
                                                // BENZER ÜRÜNLER (SLIDER) MOTORU
                                                // =======================================================
                                                const benzerUrunlerKutusu = document.getElementById("benzer-urunler-kutusu");
                                                const btnPrev = document.getElementById("prevRelatedBtn");
                                                const btnNext = document.getElementById("nextRelatedBtn");

                                                if (benzerUrunlerKutusu && parfum.category) {
                                                    fetch("/api/products")
                                                        .then(res => res.json())
                                                        .then(tumUrunler => {
                                                            benzerUrunlerKutusu.innerHTML = "";

                                                            let benzerler = tumUrunler.filter(u => u.category === parfum.category && u.id.toString() !== urunId);

                                                            if (benzerler.length === 0) {
                                                                document.querySelector(".related-products-section").style.display = "none";
                                                                return;
                                                            }

                                                            // Okları sadece 3'ten fazla ürün varsa göster
                                                            if (benzerler.length > 3) {
                                                                if (btnPrev) btnPrev.style.display = "block";
                                                                if (btnNext) btnNext.style.display = "block";
                                                            }

                                                            let favorilerData = JSON.parse(localStorage.getItem("lamasFavoriler")) || [];

                                                            benzerler.slice(0, 10).forEach(bUrun => {
                                                                let fMi = favorilerData.find(f => f.id == bUrun.id);
                                                                let kClass = fMi ? "fa-solid" : "fa-regular";
                                                                let kRenk = fMi ? "#D4AF37" : "#777";

                                                                let kartHTML = `
                                                                    <div class="related-card">
                                                                        <button type="button"
                                                                                data-id="${bUrun.id}"
                                                                                data-title="${bUrun.title.replace(/"/g, '&quot;')}"
                                                                                data-img="${bUrun.imgurl}"
                                                                                data-price="${bUrun.price}"
                                                                                onclick="window.yeniFavoriIslemi(event, this)"
                                                                                style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.1); z-index: 10;">
                                                                            <i class="${kClass} fa-heart" style="color: ${kRenk}; font-size: 16px; transition: all 0.3s;"></i>
                                                                        </button>

                                                                        <img src="${window.kucukResimGetir(bUrun.imgurl)}" onerror="this.onerror=null; this.src='${bUrun.imgurl}';" alt="${bUrun.title}" loading="lazy">
                                                                        <h3>${bUrun.title}</h3>
                                                                        <p>${parseFloat(bUrun.price).toLocaleString('tr-TR')} TL</p>
                                                                        <a href="urun.html?id=${bUrun.id}">İncele</a>
                                                                    </div>
                                                                `;
                                                                benzerUrunlerKutusu.innerHTML += kartHTML;
                                                            });

                                                            // OKLARA TIKLAMA (SLIDER KAYDIRMA) İŞLEMLERİ
                                                            if(btnNext) {
                                                                btnNext.onclick = () => {
                                                                    // Kutunun genişliği ne kadarsa o kadar sağa kaydır
                                                                    benzerUrunlerKutusu.scrollBy({ left: benzerUrunlerKutusu.offsetWidth, behavior: 'smooth' });
                                                                };
                                                            }
                                                            if(btnPrev) {
                                                                btnPrev.onclick = () => {
                                                                    // Kutunun genişliği ne kadarsa o kadar sola kaydır
                                                                    benzerUrunlerKutusu.scrollBy({ left: -benzerUrunlerKutusu.offsetWidth, behavior: 'smooth' });
                                                                };
                                                            }
                                                        })
                                                        .catch(err => {
                                                            console.error("Benzer ürünler çekilemedi:", err);
                                                            document.querySelector(".related-products-section").style.display = "none";
                                                        });
                                                }
                                                // =================== MOTOR BİTİŞİ =======================

            })
            .catch(error => console.error("Ürün detayları yüklenemedi:", error));
    }

    // --- 3. AŞAĞI İNDİKÇE SAĞDAN/SOLDAN GELME ANİMASYONLARI ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.slide-in-left, .slide-in-right');
    hiddenElements.forEach((el) => observer.observe(el));

    // --- 5. AKORDİYON (Sık Sorulan Sorular vs) ---
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const activeItem = document.querySelector('.accordion-item.active');
            if (activeItem && activeItem !== item) {
                activeItem.classList.remove('active');
            }
            item.classList.toggle('active');
        });
    });

    // --- 6. YORUM YILDIZ SEÇME VE FORM GÖNDERME (VERİTABANI BAĞLANTILI) ---
    const formStars = document.querySelectorAll('.rating-input .star');
    let selectedRating = 5;

    formStars.forEach(star => {
        star.addEventListener('mouseover', function () {
            const val = this.getAttribute('data-value');
            formStars.forEach(s => {
                if (s.getAttribute('data-value') <= val) s.classList.add('hover');
                else s.classList.remove('hover');
            });
        });
        star.addEventListener('mouseout', function () {
            formStars.forEach(s => s.classList.remove('hover'));
        });
        star.addEventListener('click', function () {
            selectedRating = this.getAttribute('data-value');
            formStars.forEach(s => {
                if (s.getAttribute('data-value') <= selectedRating) s.classList.add('active');
                else s.classList.remove('active');
            });
        });
    });

    const commentForm = document.getElementById("commentForm");
    const commentsList = document.getElementById("commentsList");
    const commentsTitle = document.querySelector(".comments-title");

    function ekranaYorumCiz(isim, metin, puan, tarih) {
        if (!commentsList) return;

        const initial = isim.charAt(0).toUpperCase();
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= puan) starsHTML += '<span class="star filled">★</span>';
            else starsHTML += '<span class="star">★</span>';
        }

        const newComment = document.createElement("div");
        newComment.classList.add("comment-item");
        newComment.innerHTML = `
            <div class="comment-header">
                <div class="comment-author">
                    <span class="avatar">${initial}</span>
                    <div class="author-info">
                        <strong>${isim}</strong>
                        <div class="comment-stars">${starsHTML}</div>
                    </div>
                </div>
                <span class="comment-date">${tarih}</span>
            </div>
            <div class="comment-body"><p>${metin}</p></div>
        `;
        commentsList.prepend(newComment);
    }

    // SAYFA AÇILDIĞINDA JAVA'DAN YORUMLARI ÇEKME (GET)
    if (urunId && commentsList) {
        fetch("/api/comments/product/" + urunId)
            .then(response => response.json())
            .then(yorumlar => {
                commentsList.innerHTML = "";

                if (yorumlar.length === 0) {
                    commentsList.innerHTML = "<p style='color: #777; font-style: italic; padding: 20px;'>Bu ürün için henüz yorum yapılmamış. İlk yorumu sen yap!</p>";
                    if(commentsTitle) commentsTitle.textContent = `Müşteri Yorumları (0)`;
                } else {
                    yorumlar.forEach(y => {
                        let tarihYazisi = y.createdAt ? y.createdAt : "Yakın zamanda";
                        ekranaYorumCiz(y.userName, y.text, y.rating, tarihYazisi);
                    });
                    if(commentsTitle) commentsTitle.textContent = `Müşteri Yorumları (${yorumlar.length})`;
                }
            })
            .catch(err => console.log("Yorumlar çekilemedi:", err));
    }

    // YENİ YORUM GÖNDERMEK (POST)
    if (commentForm) {
        commentForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById("commentName").value.trim();
            const textInput = document.getElementById("commentText").value.trim();

            if (nameInput === "" || textInput === "") {
                lamasBildirim("Lütfen isim ve yorum alanını doldurunuz.", "uyari");
                return;
            }

            if (!urunId) {
                lamasBildirim("Ürün bulunamadı!", "hata");
                return;
            }

            const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
            const today = new Date().toLocaleDateString('tr-TR', dateOptions);

            let gonderilecekYorum = {
                productId: parseInt(urunId),
                userName: nameInput,
                text: textInput,
                rating: parseInt(selectedRating),
                createdAt: today
            };

            try {
                let response = await fetch("/api/comments/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(gonderilecekYorum)
                });

                if (response.ok) {
                    if(document.querySelector("#commentsList p")) {
                        commentsList.innerHTML = "";
                    }

                    ekranaYorumCiz(nameInput, textInput, selectedRating, today);
                    lamasBildirim("Değerlendirmeniz başarıyla eklendi!", "basarili");

                    let guncelSayi = document.querySelectorAll(".comment-item").length;
                    if(commentsTitle) commentsTitle.textContent = `Müşteri Yorumları (${guncelSayi})`;

                    commentForm.reset();
                    selectedRating = 5;
                    formStars.forEach(s => s.classList.add('active'));
                } else {
                    lamasBildirim("Yorum eklenirken bir hata oluştu.", "hata");
                }
            } catch (err) {
                lamasBildirim("Sunucu ile iletişim kurulamadı.", "hata");
            }
        });
    }

    // --- 7. SEPET VE SATIN ALMA İŞLEMLERİ (HİBRİT VERİTABANI DESTEKLİ) ---
        const sepeteEkleBtn = document.querySelector('.add-cart-btn');
        if (sepeteEkleBtn) {
            sepeteEkleBtn.addEventListener('click', async () => {
                let adet = parseInt(document.getElementById("sayac").innerText);
                let baslikElementi = document.getElementById("urun-baslik");
                let urunIsmi = baslikElementi.innerText;
                // Orijinal resmi data özelliğinden çekiyoruz
                let resimUrl = baslikElementi.getAttribute("data-orijinal-resim");
                let fiyatMetni = document.getElementById("urun-fiyat").innerText;
                // ... kodun geri kalanı aynı
            let temizFiyat = fiyatMetni.replace("₺", "").replace(/\./g, "").replace(",", ".").trim();
            let fiyat = parseFloat(temizFiyat);

            if(adet === 0) {
                lamasBildirim("Lütfen en az 1 adet seçiniz!", "uyari");
                return;
            }

            let aktifKullanici = JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"));

            if (aktifKullanici && aktifKullanici.id) {
                let gonderilecekUrun = {
                    userId: aktifKullanici.id,
                    productId: parseInt(urunId),
                    title: urunIsmi,
                    size: secilenBoyut,
                    price: fiyat,
                    quantity: adet,
                    imgurl: resimUrl
                };

                try {
                    let response = await fetch("/api/cart/add", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(gonderilecekUrun)
                    });
                    if (response.ok) {
                        lamasBildirim(`Harika! ${urunIsmi} (${secilenBoyut}) sepetinize eklendi.`, "basarili");
                        if(typeof window.sepetiSunucuylaSenkronizeEt === "function") await window.sepetiSunucuylaSenkronizeEt();
                    }
                } catch (error) { console.error("Veritabanına eklenemedi:", error); }

            } else {
                            let sepet = JSON.parse(localStorage.getItem("lamasSepet")) || [];
                            let varOlanUrun = sepet.find(item => item.id === urunId && item.size === secilenBoyut);

                            if(varOlanUrun) varOlanUrun.quantity += adet;
                            else {
                                sepet.push({
                                    id: urunId, title: urunIsmi, size: secilenBoyut,
                                    price: fiyat, quantity: adet, img: resimUrl
                                });
                            }
                            localStorage.setItem("lamasSepet", JSON.stringify(sepet));
                            lamasBildirim(`Harika! ${urunIsmi} (${secilenBoyut}) sepetinize eklendi.`, "basarili");
                            window.sepetSayaciniGuncelle(); // <--- BU SATIRI EKLEDİK
                        }
        });
    }

   // HEMEN SATIN AL BUTONU
       const hemenSatinAlBtn = document.querySelector('.buy-btn');
       if (hemenSatinAlBtn) {
           hemenSatinAlBtn.addEventListener('click', async (e) => {
               e.preventDefault();
               let adet = parseInt(document.getElementById("sayac").innerText);
               if(adet === 0) {
                   lamasBildirim("Satın almak için lütfen önce adet belirleyiniz!", "uyari");
                   return;
               }

               let baslikElementi = document.getElementById("urun-baslik");
               let urunIsmi = baslikElementi.innerText;
               // Orijinal resmi data özelliğinden çekiyoruz
               let resimUrl = baslikElementi.getAttribute("data-orijinal-resim");
               let fiyatMetni = document.getElementById("urun-fiyat").innerText;
               // ... kodun geri kalanı aynı
            let temizFiyat = fiyatMetni.replace("₺", "").replace(/\./g, "").replace(",", ".").trim();
            let fiyat = parseFloat(temizFiyat);

            let aktifKullanici = JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"));

            if (aktifKullanici && aktifKullanici.id) {
                let gonderilecekUrun = {
                    userId: aktifKullanici.id,
                    productId: parseInt(urunId),
                    title: urunIsmi,
                    size: secilenBoyut,
                    price: fiyat,
                    quantity: adet,
                    imgurl: resimUrl
                };
                try {
                    await fetch("/api/cart/add", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(gonderilecekUrun)
                    });
                    if(typeof window.sepetiSunucuylaSenkronizeEt === "function") await window.sepetiSunucuylaSenkronizeEt();
                } catch (error) { console.error(error); }
            } else {
                let sepet = JSON.parse(localStorage.getItem("lamasSepet")) || [];
                let varOlanUrun = sepet.find(item => item.id === urunId && item.size === secilenBoyut);

                if(varOlanUrun) varOlanUrun.quantity += adet;
                else {
                    sepet.push({ id: urunId, title: urunIsmi, size: secilenBoyut, price: fiyat, quantity: adet, img: resimUrl });
                }
                localStorage.setItem("lamasSepet", JSON.stringify(sepet));
            }

            if (aktifKullanici) window.location.href = "adres.html";
            else window.location.href = "odeme-giris.html";
        });
    }

    // ÇÖZÜM 2: Sepet fonksiyonlarını global yapmak için window'a bağlıyoruz!
    window.sepetiSunucuylaSenkronizeEt = async function() {
        let aktifKullanici = JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"));
        if (aktifKullanici && aktifKullanici.id) {
            try {
                let response = await fetch("/api/cart/" + aktifKullanici.id);
                if (response.ok) {
                    let dbSepet = await response.json();
                    let senkronSepet = dbSepet.map(item => ({
                        cartItemId: item.id,
                        id: item.productId.toString(),
                        title: item.title,
                        size: item.size,
                        price: item.price,
                        quantity: item.quantity,
                        img: item.imgurl
                    }));
                    localStorage.setItem("lamasSepet", JSON.stringify(senkronSepet));
                    window.sepetiEkranaCiz();
                }
            } catch (err) { console.error("Senkronizasyon hatası:", err); }
        }
    }

    window.sepetiEkranaCiz = function() {
    window.sepetSayaciniGuncelle();
        const cartContainer = document.querySelector('.cart-items-container');
        if (!cartContainer) return;

        let sepet = JSON.parse(localStorage.getItem("lamasSepet")) || [];
        cartContainer.innerHTML = "";

        let araToplam = 0;

        if (sepet.length === 0) {
            cartContainer.innerHTML = "<p style='padding: 20px; font-size: 18px;'>Sepetiniz şu an boş. Alışverişe başlamak için ürünlere göz atın!</p>";
            if(document.getElementById('subtotal')) document.getElementById('subtotal').innerText = "0 TL";
            if(document.getElementById('shipping')) document.getElementById('shipping').innerText = "0 TL";
            if(document.getElementById('grandTotal')) document.getElementById('grandTotal').innerText = "0 TL";
            return;
        }

        sepet.forEach((item, index) => {
            let urunToplamFiyat = item.price * item.quantity;
            araToplam += urunToplamFiyat;

            cartContainer.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-img">
                        <img src="${window.kucukResimGetir(item.img)}" onerror="this.onerror=null; this.src='${item.img}';" alt="${item.title}" loading="lazy">
                    </div>
                    <div class="cart-item-details">
                        <h3 class="item-title">${item.title}</h3>
                        <p class="item-variant">${item.size}</p>
                        <button class="remove-item-btn" onclick="sepettenSil(${index})"><i class="fa-solid fa-trash-can"></i> Kaldır</button>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn minus" onclick="adetDegistir(${index}, -1)">-</button>
                        <input type="number" class="qty-input" value="${item.quantity}" min="1" readonly style="background-color: #F6F1E8; display: flex; align-items: center; justify-content: center; margin-left: 10px; width:40px; text-align:center;">
                        <button class="qty-btn plus" onclick="adetDegistir(${index}, 1)">+</button>
                    </div>
                    <div class="cart-item-price">
                        ${urunToplamFiyat.toLocaleString('tr-TR')} TL
                    </div>
                </div>
            `;
        });

        let kargoUcreti = 0; let kargoYazisi = "Ücretsiz";
       if (araToplam > 0 && araToplam < 900) { kargoUcreti = 50; kargoYazisi = "50 TL"; }

        let genelToplam = araToplam + kargoUcreti;
        if(document.getElementById('subtotal')) document.getElementById('subtotal').innerText = araToplam.toLocaleString('tr-TR') + " TL";
        if(document.getElementById('shipping')) document.getElementById('shipping').innerText = kargoYazisi;
        if(document.getElementById('grandTotal')) document.getElementById('grandTotal').innerText = genelToplam.toLocaleString('tr-TR') + " TL";

        window.sepetSayaciniGuncelle();
    }

    // İlk açılışta sepeti çiz
    if(typeof window.sepetiEkranaCiz === "function") window.sepetiEkranaCiz();

    // C) SİLME VE ADET DEĞİŞTİRME
    window.sepettenSil = async function(index) {
        let sepet = JSON.parse(localStorage.getItem("lamasSepet")) || [];
        let silinecekUrun = sepet[index];
        let aktifKullanici = JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"));

        if (aktifKullanici && aktifKullanici.id && silinecekUrun.cartItemId) {
            try {
                await fetch("/api/cart/remove/" + silinecekUrun.cartItemId, { method: "DELETE" });
                await window.sepetiSunucuylaSenkronizeEt();
                lamasBildirim("Ürün sepetten kaldırıldı.", "uyari");
            } catch (err) { console.error("Silme hatası:", err); }
        } else {
            sepet.splice(index, 1);
            localStorage.setItem("lamasSepet", JSON.stringify(sepet));
            window.sepetiEkranaCiz();
            lamasBildirim("Ürün sepetten kaldırıldı.", "uyari");
        }
    };

    window.adetDegistir = async function(index, degisim) {
        let sepet = JSON.parse(localStorage.getItem("lamasSepet")) || [];
        let degisecekUrun = sepet[index];
        let aktifKullanici = JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"));

        if (aktifKullanici && aktifKullanici.id && degisecekUrun.cartItemId) {
            if (degisecekUrun.quantity === 1 && degisim === -1) {
                window.sepettenSil(index); return;
            }
            let guncelData = {
                userId: aktifKullanici.id, productId: parseInt(degisecekUrun.id),
                size: degisecekUrun.size, quantity: degisim
            };
            try {
                await fetch("/api/cart/add", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(guncelData)
                });
                await window.sepetiSunucuylaSenkronizeEt();
            } catch (err) { console.error("Adet güncelleme hatası:", err); }

        } else {
            degisecekUrun.quantity += degisim;
            if (degisecekUrun.quantity < 1) degisecekUrun.quantity = 1;
            localStorage.setItem("lamasSepet", JSON.stringify(sepet));
            window.sepetiEkranaCiz();
        }
    };


    // --- 8. ŞİFRE GÖSTER / GİZLE İKONLARI ---
    const toggleIcons = document.querySelectorAll(".toggle-password, #togglePassword");
    toggleIcons.forEach(icon => {
        icon.addEventListener("click", function () {
            let targetId = this.getAttribute("data-target") || "password";
            const passwordInput = document.getElementById(targetId);

            if (passwordInput) {
                const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
                passwordInput.setAttribute("type", type);
                this.classList.toggle("fa-eye");
                this.classList.toggle("fa-eye-slash");
            }
        });
    });


    // =======================================================
    // 9. FAVORİLERİM (VERİTABANI DESTEKLİ AKILLI MOTOR)
    // =======================================================
    window.favorileriSunucuylaSenkronizeEt = async function() {
        let aktifKullanici = JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"));
        if (aktifKullanici && aktifKullanici.id) {
            try {
                let response = await fetch("/api/favorites/" + aktifKullanici.id);
                if (response.ok) {
                    let dbFavs = await response.json();
                    let senkronFavs = [];

                    if(dbFavs.length === 0) {
                        localStorage.removeItem("lamasFavoriler");
                    } else {
                        senkronFavs = dbFavs.map(item => ({
                            id: item.productId.toString(),
                            title: item.title,
                            price: item.price,
                            img: item.imgurl
                        }));
                        localStorage.setItem("lamasFavoriler", JSON.stringify(senkronFavs));
                    }

                    document.querySelectorAll("button[data-id]").forEach(btn => {
                        let favId = btn.getAttribute("data-id");
                        let icon = btn.querySelector("i");
                        if(icon) {
                            if(senkronFavs.find(f => f.id == favId)) {
                                icon.className = "fa-solid fa-heart";
                                icon.style.color = "#D4AF37";
                            } else {
                                icon.className = "fa-regular fa-heart";
                                icon.style.color = "#777";
                            }
                        }
                    });
                }
            } catch (err) { console.error("Favori senkronizasyon hatası:", err); }
        }
    };
// --- 10. ADMİN PANELİ: ÜRÜN EKLE/GÜNCELLE FORMU (RESİM YÜKLEME DESTEKLİ) ---
    // 🌟 YARDIMCI FONKSİYON: Seçilen dosyayı Java'ya atıp yolunu geri alır
    async function dosyaYukle(inputId) {
        let fileInput = document.getElementById(inputId);
        if (!fileInput || fileInput.files.length === 0) return null;

        let formData = new FormData();
        formData.append("file", fileInput.files[0]);

        try {
            let response = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });
            if (response.ok) return await response.text(); // Örn: photos/2849-abc.webp
        } catch (error) {
            console.error("Dosya yükleme hatası:", error);
        }
        return null;
    }

    let adminForm = document.getElementById("urun-ekleme-formu");
    if (adminForm) {
        adminForm.addEventListener("submit", async function(event) {
            event.preventDefault();

            // Yükleniyor bildirimi verelim
            lamasBildirim("Dosyalar yükleniyor, lütfen bekleyin...", "bilgi");

            let girilenFiyatMetni = document.getElementById("beden-fiyatlari") ? document.getElementById("beden-fiyatlari").value.trim() : "0";
            let ilkFiyat = parseFloat(girilenFiyatMetni.split(",")[0].trim()) || 0;

            // 🌟 1. AŞAMA: Önce varsa dosyaları sunucuya yükle ve yollarını al
            // Eğer yeni dosya seçilmediyse, eski gizli yolları (eski-resim-yolu) kullan (Düzenleme modu için)
            let anaResimYolu = await dosyaYukle("resim-yolu") || document.getElementById("eski-resim-yolu").value;
            let ikinciResimYolu = await dosyaYukle("ikinci-resim-yolu") || document.getElementById("eski-ikinci-resim-yolu").value;
            let vitrinVideoYolu = await dosyaYukle("video-yolu") || document.getElementById("eski-video-yolu").value;

            // 🌟 2. AŞAMA: Dosya yolları hazır, şimdi ürünü JSON olarak paketle
            let gonderilecekUrun = {
                title: document.getElementById("isim").value,
                description: document.getElementById("aciklama").value,
                price: ilkFiyat,
                category: document.getElementById("kategori").value,
                imgurl: anaResimYolu,
                secondImgUrl: ikinciResimYolu ? ikinciResimYolu : null,
                videoUrl: vitrinVideoYolu ? vitrinVideoYolu : null,
                sizes: document.getElementById("boyutlar") ? document.getElementById("boyutlar").value : "",
                sizePrices: girilenFiyatMetni,
                gender: document.getElementById("cinsiyet") ? document.getElementById("cinsiyet").value : "Unisex",
                stock: parseInt(document.getElementById("stok").value),
                topNotes: document.getElementById("ust-nota") ? document.getElementById("ust-nota").value : null,
                middleNotes: document.getElementById("orta-nota") ? document.getElementById("orta-nota").value : null,
                baseNotes: document.getElementById("alt-nota") ? document.getElementById("alt-nota").value : null
            };

            let islemTuru = duzenlenenUrunId ? "PUT" : "POST";
            let hedefAdres = duzenlenenUrunId ? "/api/products/" + duzenlenenUrunId : "/api/products";

            fetch(hedefAdres, {
                method: islemTuru,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(gonderilecekUrun)
            })
            .then(response => {
                if (response.ok) {
                    if (duzenlenenUrunId) lamasBildirim("Ürün başarıyla güncellendi! 🔄", "basarili");
                    else lamasBildirim("Tebrikler patron! Ürün başarıyla eklendi. 🎉", "basarili");

                    adminForm.reset();
                    duzenlenenUrunId = null;
                    document.querySelector(".admin-btn").innerText = "Ürünü Kaydet";

                    // Eski gizli resim yollarını da temizle
                    document.getElementById("eski-resim-yolu").value = "";
                    document.getElementById("eski-ikinci-resim-yolu").value = "";
                    document.getElementById("eski-video-yolu").value = "";

                    adminUrunleriGetir();
                    parfumeriGetir();
                } else {
                    lamasBildirim("İşlem sırasında bir hata oluştu!", "hata");
                }
            })
            .catch(error => console.error("Kurye yolda kaza yaptı:", error));
        });
    }

    // --- 11. VİTRİN SHOWCASE (İLERİ-GERİ ANİMASYONLU) ---
    const titleEl = document.getElementById("perfumeTitle");
    const nextShowcaseBtn = document.getElementById("nextShowcaseBtn");
    const prevShowcaseBtn = document.getElementById("prevShowcaseBtn");
    const notesBox = document.getElementById("notesContainer");
    const textBox = document.getElementById("textContainer");
    const bottleBox = document.getElementById("bottleContainer");

    if (titleEl && nextShowcaseBtn && prevShowcaseBtn) {
        nextShowcaseBtn.addEventListener("click", () => {
            if (vitrinUrunleri.length === 0 || isAnimating) return;
            isAnimating = true;

            bottleBox.classList.add("sc-out-left");
            textBox.classList.add("sc-out-down");
            notesBox.classList.add("sc-out-right");

            setTimeout(() => {
                currentIndex++;
                if (currentIndex >= vitrinUrunleri.length) currentIndex = 0;
                loadPerfume(currentIndex);

                notesBox.style.transition = "none";
                textBox.style.transition = "none";
                bottleBox.style.transition = "none";

                bottleBox.classList.remove("sc-out-left");
                textBox.classList.remove("sc-out-down");
                notesBox.classList.remove("sc-out-right");

                bottleBox.classList.add("sc-in-left");
                textBox.classList.add("sc-in-down");
                notesBox.classList.add("sc-in-right");

                setTimeout(() => {
                    notesBox.style.transition = "transform 0.6s ease-in-out, opacity 0.6s ease-in-out";
                    textBox.style.transition = "transform 0.6s ease-in-out, opacity 0.6s ease-in-out";
                    bottleBox.style.transition = "transform 0.6s ease-in-out, opacity 0.6s ease-in-out";

                    bottleBox.classList.remove("sc-in-left");
                    textBox.classList.remove("sc-in-down");
                    notesBox.classList.remove("sc-in-right");

                    setTimeout(() => { isAnimating = false; }, 600);
                }, 50);
            }, 600);
        });

        prevShowcaseBtn.addEventListener("click", () => {
            if (vitrinUrunleri.length === 0 || isAnimating) return;
            isAnimating = true;

            bottleBox.classList.add("sc-out-left");
            textBox.classList.add("sc-out-down");
            notesBox.classList.add("sc-out-right");

            setTimeout(() => {
                currentIndex--;
                if (currentIndex < 0) currentIndex = vitrinUrunleri.length - 1;
                loadPerfume(currentIndex);

                notesBox.style.transition = "none";
                textBox.style.transition = "none";
                bottleBox.style.transition = "none";

                bottleBox.classList.remove("sc-out-left");
                textBox.classList.remove("sc-out-down");
                notesBox.classList.remove("sc-out-right");

                bottleBox.classList.add("sc-in-left");
                textBox.classList.add("sc-in-down");
                notesBox.classList.add("sc-in-right");

                setTimeout(() => {
                    notesBox.style.transition = "transform 0.6s ease-in-out, opacity 0.6s ease-in-out";
                    textBox.style.transition = "transform 0.6s ease-in-out, opacity 0.6s ease-in-out";
                    bottleBox.style.transition = "transform 0.6s ease-in-out, opacity 0.6s ease-in-out";

                    bottleBox.classList.remove("sc-in-left");
                    textBox.classList.remove("sc-in-down");
                    notesBox.classList.remove("sc-in-right");

                    setTimeout(() => { isAnimating = false; }, 600);
                }, 50);
            }, 600);
        });
    }

}); // DOMContentLoaded BİTİŞİ


// =======================================================
// GLOBAL FONKSİYONLAR (Her yerden çağrılabilirler)
// =======================================================

function arttir(miktar) {
    sayi += miktar;
    let sayacElementi = document.getElementById('sayac');
    if(sayacElementi) sayacElementi.innerText = sayi;
}

function azalt(miktar){
    if(sayi > 1) sayi -= miktar;
    let sayacElementi = document.getElementById('sayac');
    if(sayacElementi) sayacElementi.innerText = sayi;
}

function vitriniVeritabanindanGetir() {
    fetch("/api/products")
        .then(response => response.json())
        .then(data => {
            vitrinUrunleri = data.filter(urun => urun.category === "Oda Kokusu");

            vitrinUrunleri.forEach(urun => {
                let img = new Image();
                let resimYolu = urun.secondImgUrl ? urun.secondImgUrl : urun.imgurl;
                // Arka planda küçük resmi önden yüklüyoruz
                img.src = window.kucukResimGetir(resimYolu);
            });

            if (vitrinUrunleri.length > 0 && document.getElementById("perfumeTitle")) {
                loadPerfume(0);
            }
        })
        .catch(error => console.error("Vitrin verisi çekilemedi:", error));
}

function loadPerfume(index) {
    if (!vitrinUrunleri || vitrinUrunleri.length === 0) return;

    let secilenUrun = vitrinUrunleri[index];
    const titleEl = document.getElementById("perfumeTitle");
    const descEl = document.getElementById("perfumeDesc");
    const bottleEl = document.getElementById("bottleImg");
    const notesEl = document.getElementById("notesImg");
    const viewBtn = document.getElementById("viewProductBtn");

    if (titleEl) titleEl.textContent = secilenUrun.title;
    if (descEl) descEl.textContent = secilenUrun.description;

    // 🌟 THUMBNAIL VE ONERROR DESTEKLİ VİTRİN RESMİ
    if (bottleEl) {
        let orjinalResim = secilenUrun.secondImgUrl ? secilenUrun.secondImgUrl : secilenUrun.imgurl;
        bottleEl.src = window.kucukResimGetir(orjinalResim);

        // Eğer küçük resim sunucuda yoksa, çökmeden orijinali yükle
        bottleEl.onerror = function() {
            this.onerror = null;
            this.src = orjinalResim;
        };
    }

    if (notesEl) {
        if (secilenUrun.videoUrl) {
            notesEl.src = secilenUrun.videoUrl;
            notesEl.style.display = "block";
        } else {
            notesEl.src = "";
            notesEl.style.display = "none";
        }
    }

    if (viewBtn) {
        viewBtn.href = "urun.html?id=" + secilenUrun.id;
    }
}
function parfumeriGetir() {
    fetch("/api/products")
        .then(response => response.json())
        .then(data => {



            let colorsKutusu = document.getElementById("urun-listesi-colors");
            let mixKutusu = document.getElementById("urun-listesi-mix");
            let odaKokusuKutusu = document.getElementById("urun-listesi-odakokusu");
            let vucutSpreyiKutusu = document.getElementById("urun-listesi-vucutspreyi");
            let odaSpreyiKutusu = document.getElementById("urun-listesi-odaspreyi");
            let kadinKutusu = document.getElementById("urun-listesi-kadin");
            let erkekKutusu = document.getElementById("urun-listesi-erkek");
            let deodorantKutusu = document.getElementById("urun-listesi-deodorant");

            let tumOdaKokulari = document.getElementById("tum-odakokulari");
            let sadeceCubuklar = document.getElementById("sadece-cubuklar");
            let tumColors = document.getElementById("tum-colors");
            let tumMix = document.getElementById("tum-mix");
            let tumVucut = document.getElementById("tum-vucut");
            let tumOdaSpreyi = document.getElementById("tum-odaspreyleri");
            let tumDeodorantlar = document.getElementById("tum-deodorantlar");

            if(colorsKutusu) colorsKutusu.innerHTML = "";
            if(mixKutusu) mixKutusu.innerHTML = "";
            if(odaKokusuKutusu) odaKokusuKutusu.innerHTML = "";
            if(vucutSpreyiKutusu) vucutSpreyiKutusu.innerHTML = "";
            if(odaSpreyiKutusu) odaSpreyiKutusu.innerHTML = "";
            if(deodorantKutusu) deodorantKutusu.innerHTML = "";

            if(tumOdaKokulari) tumOdaKokulari.innerHTML = "";
            if(tumColors) tumColors.innerHTML = "";
            if(tumMix) tumMix.innerHTML = "";
            if(tumVucut) tumVucut.innerHTML = "";
            if(tumOdaSpreyi) tumOdaSpreyi.innerHTML = "";
            if(tumDeodorantlar) tumDeodorantlar.innerHTML = "";

           let colorsSayaci = 0, mixSayaci = 0, odaKokusuSayaci = 0, vucutSpreyiSayaci = 0, odaSpreyiSayaci = 0, deodorantSayaci = 0;

            let favoriler = JSON.parse(localStorage.getItem("lamasFavoriler")) || [];

            let kadinVitrinIsimleri = ["Lamas Boss Lady", "Lamas Salty Vanilla", "Lamas Red Chic", "Lamas Weekend"];
            let erkekVitrinIsimleri = ["Lamas Aqua Wave", "Lamas Royal Oud", "Lamas Deep Blue", "Lamas Legend Man"];

                      data.forEach(parfum => {
                          let favoriMi = favoriler.find(f => f.id == parfum.id);
                          let kalpClass = favoriMi ? "fa-solid" : "fa-regular";
                          let kalpRenk = favoriMi ? "#D4AF37" : "#777";

                          // 🌟 YENİ: Sadece Deodorantlar için fotoğrafa hafif bir zoom stili tanımlıyoruz
                          // 1.1 değerini ne kadar artırırsan (örn: 1.15 veya 1.2) o kadar çok zoom yapar.
                          let resimStili = (parfum.category === "Deodorant") ? "transform: scale(1.15);" : "";

                          let kart = `
                              <div class="room-card" style="position: relative; cursor: pointer;" onclick="window.location.href='urun.html?id=${parfum.id}'">
                                  <button type="button"
                                          data-id="${parfum.id}"
                                          data-title="${parfum.title.replace(/"/g, '&quot;')}"
                                          data-img="${parfum.imgurl}"
                                          data-price="${parfum.price}"
                                          onclick="window.yeniFavoriIslemi(event, this)"
                                          style="position: absolute; top: 15px; right: 15px; background: white; border: none; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 10; transition: transform 0.2s;">
                                      <i class="${kalpClass} fa-heart" style="color: ${kalpRenk}; font-size: 18px; transition: all 0.3s;"></i>
                                  </button>

                                  <div class="img-room">

                                     <img src="${window.kucukResimGetir(parfum.imgurl)}" onerror="this.onerror=null; this.src='${parfum.imgurl}';" alt="${parfum.title}" loading="lazy" style="${resimStili} transition: transform 0.3s ease;">
                                  </div>
                                  <div class="img-info">
                                      <h2>${parfum.title}</h2>
                                      <p>${parfum.description}</p>
                                      <a href="urun.html?id=${parfum.id}" class="room-gozat">Göz at</a>
                                  </div>
                              </div>
                          `;


                if (parfum.category === "Colors") {
                    if (colorsKutusu && colorsSayaci < 4) { colorsKutusu.innerHTML += kart; colorsSayaci++; }
                    if (tumColors) tumColors.innerHTML += kart;
                }
                else if (parfum.category === "Mix") {
                    if (mixKutusu && mixSayaci < 4) { mixKutusu.innerHTML += kart; mixSayaci++; }
                    if (tumMix) tumMix.innerHTML += kart;
                }
              else if (parfum.category === "Oda Kokusu") {
                   if (odaKokusuKutusu && odaKokusuSayaci < 4) { odaKokusuKutusu.innerHTML += kart; odaKokusuSayaci++; }
                   if (tumOdaKokulari) tumOdaKokulari.innerHTML += kart; // Ana sayfaya gönder
                   if (sadeceCubuklar) sadeceCubuklar.innerHTML += kart; // Sadece çubuk sayfasına gönder
               }
                else if (parfum.category === "Vucut Spreyi") {
                    if (vucutSpreyiKutusu && vucutSpreyiSayaci < 4) { vucutSpreyiKutusu.innerHTML += kart; vucutSpreyiSayaci++; }
                    if (tumVucut) tumVucut.innerHTML += kart;
                }
                else if (parfum.category === "Oda Spreyi") {
                    if (odaSpreyiKutusu && odaSpreyiSayaci < 4) { odaSpreyiKutusu.innerHTML += kart; odaSpreyiSayaci++; }
                    if (tumOdaSpreyi) tumOdaSpreyi.innerHTML += kart;
                    if (tumOdaKokulari) tumOdaKokulari.innerHTML += kart;
                }
               else if (parfum.category === "Deodorant") {

                   if (deodorantKutusu && deodorantSayaci < 4) { deodorantKutusu.innerHTML += kart; deodorantSayaci++; }

                   if (tumDeodorantlar) tumDeodorantlar.innerHTML += kart;
               }

               if (kadinKutusu) {
                       let eslesmeVarMi = kadinVitrinIsimleri.some(isim => parfum.title.includes(isim));
                       if (eslesmeVarMi) kadinKutusu.innerHTML += kart;
                   }

                   if (erkekKutusu) {
                       let eslesmeVarMi = erkekVitrinIsimleri.some(isim => parfum.title.includes(isim));
                       if (eslesmeVarMi) erkekKutusu.innerHTML += kart;
                   }
            });
        })
        .catch(error => console.error("Vitrin verisi çekilirken hata oluştu:", error));
}
function adminUrunleriGetir() {
    let adminTablo = document.getElementById("admin-urun-listesi");
    if (!adminTablo) return;

    fetch("/api/products")
        .then(response => response.json())
        .then(data => {
            adminTablo.innerHTML = "";
            data.forEach(parfum => {
                let satir = `
                    <tr>

                        <td><img src="${window.kucukResimGetir(parfum.imgurl)}" onerror="this.onerror=null; this.src='${parfum.imgurl}';" alt="${parfum.title}" loading="lazy"></td>
                        <td>${parfum.title}</td>
                        <td>${parfum.category}</td>
                        <td>${parfum.price} TL</td>
                        <td style="font-weight:bold; color: ${parfum.stock > 0 ? 'green' : 'red'};">${parfum.stock > 0 ? parfum.stock + ' Adet' : 'Tükendi!'}</td>
                        <td>
                            <button class="btn-duzenle" onclick="urunDuzenle(${parfum.id})">Düzenle</button>
                            <button class="btn-sil" onclick="urunSil(${parfum.id})">Sil</button>
                        </td>
                    </tr>
                `;
                adminTablo.innerHTML += satir;
            });
        });
}

function urunSil(id) {
    if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
        fetch("/api/products/" + id, { method: "DELETE" })
        .then(response => {
            if (response.ok) {
                lamasBildirim("Ürün başarıyla silindi!", "basarili");
                adminUrunleriGetir();
                parfumeriGetir();
            }
        });
    }
}

function urunDuzenle(id) {
    fetch("/api/products")
        .then(response => response.json())
        .then(data => {
            let secilenUrun = data.find(parfum => parfum.id === id);
            if (secilenUrun) {
                if(document.getElementById("isim")) document.getElementById("isim").value = secilenUrun.title;
                if(document.getElementById("aciklama")) document.getElementById("aciklama").value = secilenUrun.description;
                if(document.getElementById("kategori")) document.getElementById("kategori").value = secilenUrun.category;

                if(document.getElementById("cinsiyet")) document.getElementById("cinsiyet").value = secilenUrun.gender || "Unisex";
                if (document.getElementById("stok")) document.getElementById("stok").value = secilenUrun.stock || 0;
                if(document.getElementById("ust-nota")) document.getElementById("ust-nota").value = secilenUrun.topNotes || "";
                if(document.getElementById("orta-nota")) document.getElementById("orta-nota").value = secilenUrun.middleNotes || "";
                if(document.getElementById("alt-nota")) document.getElementById("alt-nota").value = secilenUrun.baseNotes || "";

                if(document.getElementById("eski-resim-yolu")) document.getElementById("eski-resim-yolu").value = secilenUrun.imgurl || "";
                if(document.getElementById("eski-ikinci-resim-yolu")) document.getElementById("eski-ikinci-resim-yolu").value = secilenUrun.secondImgUrl || "";
                if(document.getElementById("eski-video-yolu")) document.getElementById("eski-video-yolu").value = secilenUrun.videoUrl || "";

                // Dosya seçicileri (file input) bilerek boş bırakıyoruz. Müşteri yeni bir dosya seçmezse, yukarıdaki gizli yollar kullanılacak.
                if(document.getElementById("resim-yolu")) document.getElementById("resim-yolu").removeAttribute("required");

                let ikinciResim = document.getElementById("ikinci-resim-yolu");
                let videoYolu = document.getElementById("video-yolu");
                let boyutKutusu = document.getElementById("boyutlar");
                let fiyatKutusu = document.getElementById("beden-fiyatlari");

                if (boyutKutusu) boyutKutusu.value = secilenUrun.sizes || "";
                if (fiyatKutusu) fiyatKutusu.value = secilenUrun.sizePrices ? secilenUrun.sizePrices : secilenUrun.price;

                duzenlenenUrunId = id;
                let btn = document.querySelector(".admin-btn");
                if(btn) btn.innerText = "Ürünü Güncelle";

                let urunEkleBolumu = document.getElementById("bolum-urun-ekle");
                                if (urunEkleBolumu) {
                                    urunEkleBolumu.scrollIntoView({ behavior: 'smooth' });
                                }
                            }

        })
        .catch(error => console.error("Düzenleme moduna geçerken hata:", error));
}

// =======================================================
// 12. HESAP İŞLEMLERİ (KAYIT OL VE GİRİŞ YAP)
// =======================================================
document.addEventListener("DOMContentLoaded", () => {

    // A) KAYIT OLMA (REGISTER) İŞLEMİ
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", function (e) {
            e.preventDefault();

            let password = document.getElementById("regPassword").value;
            let confirmPassword = document.getElementById("regPasswordConfirm").value;

            if (password !== confirmPassword) {
                lamasBildirim("Hata: Şifreler birbiriyle uyuşmuyor!", "hata");
                return;
            }

            if (!document.getElementById("terms").checked) {
                lamasBildirim("Kayıt olmak için kullanıcı sözleşmesini kabul etmelisiniz.", "uyari");
                return;
            }

            let newUser = {
                name: document.getElementById("firstName").value.trim(),
                surname: document.getElementById("lastName").value.trim(),
                email: document.getElementById("regEmail").value.trim(),
                password: password
            };

            fetch("/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser)
            })
            .then(async response => {
                let data = await response.text();
                if (response.ok) {
                    lamasBildirim("Aramıza hoş geldiniz! Kaydınız başarıyla oluşturuldu.", "basarili");
                    setTimeout(() => { window.location.href = "giris.html"; }, 2000);
                } else {
                    lamasBildirim(data, "hata");
                }
            })
            .catch(error => console.error("Kayıt sırasında hata:", error));
        });
    }

    // B) GİRİŞ YAPMA (LOGIN) İŞLEMİ
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();

            let loginData = {
                email: document.getElementById("email").value.trim(),
                password: document.getElementById("password").value
            };

            fetch("/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData)
            })
            .then(async response => {
                            if (response.ok) {
                                let user = await response.json();
                                localStorage.setItem("lamasGirisYapanKullanici", JSON.stringify(user));

                                // 🌟 YENİ EKLENEN: E-posta kontrolü
                                if (user.email === "admin@lamasparfum.com") {
                                    lamasBildirim("Patron girişi başarılı, panele yönlendiriliyorsunuz!", "basarili");
                                    setTimeout(() => { window.location.href = "admin.html"; }, 1500);
                                } else {
                                    lamasBildirim(`Hoş geldin, ${user.name}!`, "basarili");
                                    setTimeout(() => { window.location.href = "/"; }, 1500);
                                }
                            } else {
                                let errorMessage = await response.text();
                                lamasBildirim(errorMessage, "hata");
                            }
                        })
            .catch(error => console.error("Giriş sırasında hata:", error));
        });
    }
});

// =======================================================
// 13. OTURUM KONTROLCÜSÜ (GİRİŞ YAPAN KULLANICIYI TANIMA)
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
    let aktifKullanici = localStorage.getItem("lamasGirisYapanKullanici");

    const userIcons = document.querySelectorAll('.fa-user');
    userIcons.forEach(icon => {
        const link = icon.closest('a');
        if (link && aktifKullanici) {
            link.href = "hesabim.html";
        }
    });

    const sepetCheckoutBtn = document.getElementById("sepetOdemeBtn");

    if (sepetCheckoutBtn) {
        sepetCheckoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            let sepet = JSON.parse(localStorage.getItem("lamasSepet")) || [];
            if(sepet.length === 0) {
                lamasBildirim("Sepetiniz boş, lütfen önce ürün ekleyin!", "uyari");
                return;
            }

            if (aktifKullanici) {
                window.location.href = "adres.html";
            } else {
                window.location.href = "odeme-giris.html";
            }
        });
    }
});

window.siparisiTamamla = async function(event) {
    let sozlesmeKutusu = document.getElementById("sozlesmeOnay");
    if (sozlesmeKutusu && !sozlesmeKutusu.checked) {
        lamasBildirim("Lütfen Mesafeli Satış Sözleşmesi'ni onaylayın.", "uyari");
        return;
    }

    if(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // 1. KART BİLGİLERİNİ KUTULARDAN ÇEK (Kuveyt Türk İçin Şart)
    let cName = document.getElementById("cardName").value.trim();
    let cNumber = document.getElementById("cardNumber").value.replace(/\s+/g, '').trim(); // Boşlukları temizle
    let cMonth = document.getElementById("cardMonth").value.trim();
    let cYear = document.getElementById("cardYear").value.trim();
    let cCvv = document.getElementById("cardCvv").value.trim();

    if(!cName || !cNumber || !cMonth || !cYear || !cCvv) {
        lamasBildirim("Lütfen kredi kartı bilgilerini eksiksiz giriniz.", "uyari");
        return;
    }

    // 2. MÜŞTERİ VE SEPET BİLGİLERİNİ TOPLA
    let geciciAdres = JSON.parse(localStorage.getItem("lamasGeciciAdres")) || {};
    let aktifKullanici = JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"));
    let musteriTel = geciciAdres.telefon ? geciciAdres.telefon : (aktifKullanici && aktifKullanici.phone ? aktifKullanici.phone : "05555555555");
   let tamAdres = geciciAdres.adres ? (geciciAdres.sehir + ", " + geciciAdres.adres + " | Tel: " + musteriTel) : "Adres bilgisi alınamadı";
    let musteriAdi = geciciAdres.adSoyad ? geciciAdres.adSoyad : (aktifKullanici ? aktifKullanici.name + " " + aktifKullanici.surname : "Misafir Müşteri");
    let siparisMaili = geciciAdres.email || (aktifKullanici ? aktifKullanici.email : null);

    let sepet = JSON.parse(localStorage.getItem("lamasSepet")) || [];
    if (sepet.length === 0) {
        lamasBildirim("Sepetiniz boş!", "uyari");
        return;
    }

    let araToplam = 0;
    sepet.forEach(i => araToplam += (i.price * i.quantity));


    // let kargo = (araToplam > 0 && araToplam < 900) ? 50 : 0;
     let kargo=0;


    let genelToplam = araToplam + kargo;
    let uretilenKod = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. JAVA'YA GİDECEK KESİN PAKET (Sipariş Paketi + Kredi Kartı Bilgileri)
    let siparisPaketi = {
        order: {
            userId: (aktifKullanici && aktifKullanici.id) ? aktifKullanici.id : null,
            orderCode: uretilenKod,
            customerName: musteriAdi,
            deliveryAddress: tamAdres,
            customerPhone: musteriTel,
            contactEmail: siparisMaili,
            totalAmount: genelToplam,
            items: sepet.map(item => ({
                productId: parseInt(item.id) || 1,
                title: item.title,
                size: item.size || "Standart",
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity),
                imgurl: item.img
            }))
        },
        kartNo: cNumber,
        ay: cMonth,
        yil: cYear,
        cvv: cCvv
    };

    // 4. YÜKLEME EKRANI
    let islemEkrani = document.createElement("div");
    islemEkrani.id = "loadingEkrani";
    islemEkrani.style.position = "fixed";
    islemEkrani.style.top = "0";
    islemEkrani.style.left = "0";
    islemEkrani.style.width = "100%";
    islemEkrani.style.height = "100%";
    islemEkrani.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    islemEkrani.style.display = "flex";
    islemEkrani.style.flexDirection = "column";
    islemEkrani.style.alignItems = "center";
    islemEkrani.style.justifyContent = "center";
    islemEkrani.style.zIndex = "999999";
    islemEkrani.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: #D4AF37; font-size: 70px; margin-bottom: 25px;"></i><h2 style="color: #fff; margin-bottom: 10px; font-size: 26px;">Bankaya Bağlanıyor...</h2>`;
    document.body.appendChild(islemEkrani);

try {
        let response = await fetch("/api/kuveytturk/pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(siparisPaketi)
        });

        let bankaFormu = await response.text();

        if (response.ok && bankaFormu.includes("<form") && !bankaFormu.includes("Aradığınız sayfa")) {
            // Yükleme ekranını kaldır
            document.body.removeChild(islemEkrani);

            // 🌟 KESİN ÇÖZÜM: Tarayıcının belgesini bankadan gelen HTML ile tamamen değiştiriyoruz.
            // Bu sayede BKM'nin tarayıcı çözünürlüğü toplayan ve formu otomatik submit eden
            // scriptleri anında çalışacak ve seni doğrudan 3D Secure / SMS ekranına fırlatacaktır.
            document.open();
            document.write(bankaFormu);
            document.close();
        } else {
            document.body.removeChild(islemEkrani);
            lamasBildirim("Banka simülatörü hata döndürdü.", "hata");
            console.error("Kuveyt Türk Hata Çıktısı:", bankaFormu);
        }
    } catch (error) {
        if (document.getElementById("loadingEkrani")) document.body.removeChild(document.getElementById("loadingEkrani"));
        lamasBildirim("Sunucu ile bağlantı kurulamadı.", "hata");
    }
    }
// =======================================================
// 14. ADMİN PANELİ: SİPARİŞ YÖNETİMİ VE TARİH GRUPLAMASI
// =======================================================
function adminSiparisleriGetir() {
    let siparisTablo = document.getElementById("admin-siparis-listesi");
    if (!siparisTablo) return;

    fetch("/api/orders/all")
        .then(response => response.json())
        .then(data => {
            siparisTablo.innerHTML = "";

            if(data.length === 0) {
                siparisTablo.innerHTML = "<tr><td colspan='5' style='padding:20px; text-align:center; color:#777;'>Henüz gelen bir sipariş yok.</td></tr>";
                return;
            }

          // 1. Siparişleri En Yeniden En Eskiye Doğru Sırala
                      data.sort((a, b) => {
                          let dateA = Array.isArray(a.orderDate) ? new Date(a.orderDate[0], a.orderDate[1]-1, a.orderDate[2], a.orderDate[3], a.orderDate[4]) : new Date(a.orderDate);
                          let dateB = Array.isArray(b.orderDate) ? new Date(b.orderDate[0], b.orderDate[1]-1, b.orderDate[2], b.orderDate[3], b.orderDate[4]) : new Date(b.orderDate);
                          return dateB - dateA;
                      });


                     let gecerliSiparisler = data.filter(siparis => siparis.status !== "Beklemede");

                      if(gecerliSiparisler.length === 0) {
                          siparisTablo.innerHTML = "<tr><td colspan='5' style='padding:20px; text-align:center; color:#777;'>Henüz ödemesi tamamlanmış bir sipariş yok.</td></tr>";
                          return;
                      }

                      // "Bugün" ve "Dün" hesaplamaları için gece yarısı saatlerini referans alıyoruz
                      const bugun = new Date();
                      bugun.setHours(0,0,0,0);

                      const dun = new Date(bugun);
                      dun.setDate(dun.getDate() - 1);

                      let sonGosterilenGrupTarihi = "";

                      // 🌟 EKLENEN: Hafızadaki indirilenleri kontrol et
                      let indirilenPdfler = JSON.parse(localStorage.getItem("lamasIndirilenPdfler")) || [];

                      // 🌟 DİKKAT: Artık 'data' yerine filtrelenmiş 'gecerliSiparisler' üzerinden dönüyoruz
                      gecerliSiparisler.forEach(siparis => {
                // Tarihi güvenle parse etme (Dizi veya String gelme ihtimaline karşı)
                let siparisTarihi;
                if (Array.isArray(siparis.orderDate)) {
                    siparisTarihi = new Date(siparis.orderDate[0], siparis.orderDate[1]-1, siparis.orderDate[2], siparis.orderDate[3], siparis.orderDate[4]);
                } else {
                    siparisTarihi = new Date(siparis.orderDate);
                }

                // Sadece tarih kıyaslaması yapmak için saatleri sıfırlayalım
                let sadeceTarih = new Date(siparisTarihi);
                sadeceTarih.setHours(0,0,0,0);

                let grupBasligi = "";
                let tarihMetniFormatli = siparisTarihi.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

                // Tarihin Bugün, Dün veya Geçmiş bir gün olup olmadığını bul
                if (sadeceTarih.getTime() === bugun.getTime()) {
                    grupBasligi = "Bugün";
                } else if (sadeceTarih.getTime() === dun.getTime()) {
                    grupBasligi = "Dün";
                } else {
                    grupBasligi = tarihMetniFormatli; // Örn: "18 Ağustos 2026"
                }

                // EĞER GRUP DEĞİŞTİYSE (YENİ BİR GÜNE GEÇTİYSEK) ARAYA AYIRICI ŞERİT EKLE
                if (sonGosterilenGrupTarihi !== grupBasligi) {
                    let ayiriciSatir = `
                        <tr style="background-color: #F6F1E8;">
                            <td colspan="5" style="padding: 10px 15px; font-weight: bold; color: #111; font-size: 14px; border-bottom: 2px solid #D4AF37;">
                                <i class="fa-regular fa-calendar-days" style="color: #D4AF37; margin-right: 5px;"></i>
                                <span style="text-transform: uppercase; letter-spacing: 1px;">${grupBasligi}</span>
                            </td>
                        </tr>
                    `;
                    siparisTablo.innerHTML += ayiriciSatir;
                    sonGosterilenGrupTarihi = grupBasligi; // Son başlığı güncelle
                }

                // Satır İçi Saat Formatı
                              let saatMetni = siparisTarihi.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                              // 🌟 DÜZELTME: Butonun rengini belirleyen JS kodları, HTML metninin (backtick) DIŞINA alındı!
                              let isDownloaded = indirilenPdfler.includes(siparis.id.toString());
                              let pdfBtnColor = isDownloaded ? "#27ae60" : "#2c3e50";
                              let pdfBtnText = isDownloaded ? '<i class="fa-solid fa-check-double"></i> İndirildi' : '<i class="fa-solid fa-file-pdf"></i> PDF İndir';

                              let adminKargoBilgisi = siparis.trackingNumber
                                                  ? `<div style="margin-top: 8px; font-size: 11px; background: #e8f5e9; color: #27ae60; padding: 4px 8px; border-radius: 4px; display: inline-block; border: 1px solid #c8e6c9;"><i class="fa-solid fa-truck-fast"></i> Takip No: <b style="letter-spacing: 0.5px;">${siparis.trackingNumber}</b></div>`
                                                  : `<div style="margin-top: 8px; font-size: 11px; background: #fdf2f2; color: #e74c3c; padding: 4px 8px; border-radius: 4px; display: inline-block; border: 1px solid #fadbd8;"><i class="fa-solid fa-hourglass-half"></i> Kod Bekleniyor</div>`;
                              // SİPARİŞ SATIRINI EKRANA BAS (Orijinal Yapın Korundu)

                              let satir = `
                                 <tr style="border-bottom: 1px solid #eee; transition: background 0.3s;">
                                     <td style="padding: 15px; font-weight: bold; color: #555;">
                                                <div style="font-size: 14px;">#${siparis.orderCode || siparis.id}</div>
                                                ${adminKargoBilgisi}
                                            </td>
                                   <td style="padding: 15px;">
                                       <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${siparis.customerName}</div>
                                       <div style="font-size: 12px; color: #007bff; margin-bottom: 5px;">
                                           <i class="fa-regular fa-envelope"></i> ${siparis.contactEmail || "Belirtilmedi"}
                                       </div>
                                       <div style="font-size: 12px; color: #888;">
                                           <i class="fa-regular fa-clock"></i> ${saatMetni}
                                       </div>
                                   </td>
                                     <td style="padding: 15px; font-size: 13px; max-width: 250px; line-height: 1.4;">${siparis.deliveryAddress}</td>
                                     <td style="padding: 15px; color: #D4AF37; font-weight: bold; font-size: 16px;">${siparis.totalAmount.toLocaleString('tr-TR')} TL</td>
                                     <td style="padding: 15px;">
                                         <select onchange="siparisDurumGuncelle(${siparis.id}, this.value)" style="padding: 8px; border-radius: 5px; border: 1px solid #ddd; margin-bottom: 5px; width: 100%; font-weight: bold;">
                                             <option value="Sipariş Alındı" ${siparis.status === 'Sipariş Alındı' ? 'selected' : ''}>📦 Sipariş Alındı</option>
                                             <option value="Hazırlanıyor" ${siparis.status === 'Hazırlanıyor' ? 'selected' : ''}>⏳ Hazırlanıyor</option>
                                             <option value="Kargoya Verildi" ${siparis.status === 'Kargoya Verildi' ? 'selected' : ''}>🚚 Kargoya Verildi</option>
                                             <option value="Teslim Edildi" ${siparis.status === 'Teslim Edildi' ? 'selected' : ''}>✅ Teslim Edildi</option>
                                         </select>

                                         <button onclick="siparisPdfIndir(${siparis.id}, this)" style="width: 100%; padding: 8px; background: ${pdfBtnColor}; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; margin-top: 5px; transition: 0.3s;">
                                             ${pdfBtnText}
                                         </button>

                                         <button onclick="siparisIadeEt(${siparis.id})" style="width: 100%; padding: 8px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; margin-top: 5px; transition: 0.3s;">
                                                 <i class="fa-solid fa-rotate-left"></i> İade Et
                                             </button>
                                     </td>
                                 </tr>
                             `;
                              siparisTablo.innerHTML += satir;
            });
        })
        .catch(error => console.error("Admin siparişleri çekilemedi:", error));
}
window.siparisDurumGuncelle = async function(id, yeniDurum) {
    try {
        let response = await fetch(`/api/orders/update-status/${id}?status=${encodeURIComponent(yeniDurum)}`, {
            method: "PUT"
        });

        if(response.ok) {
            lamasBildirim(`Sipariş #${id} başarıyla "${yeniDurum}" olarak güncellendi!`, "basarili");
            adminSiparisleriGetir();
        } else {
            lamasBildirim("Durum güncellenirken bir hata oluştu!", "hata");
        }
    } catch(e) {
        console.error("Durum güncelleme hatası:", e);
    }
};

window.hesabimFavorileriGoster = function() {
   const icerikKutusu = document.querySelector(".account-content");
   let favoriler = JSON.parse(localStorage.getItem("lamasFavoriler")) || [];

   if (favoriler.length === 0) {
       icerikKutusu.innerHTML = `
           <h2 class="content-title">Favorilerim</h2>
           <p style="color: #777; margin-top:20px;">Henüz favoriye eklediğiniz bir ürün bulunmamaktadır. Kalp ikonlarına tıklayarak ürünleri buraya ekleyebilirsiniz.</p>
       `;
       return;
   }

   let html = '<h2 class="content-title">Favorilerim</h2><div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">';

   favoriler.forEach(urun => {
       html += `
           <div style="border: 1px solid #eee; border-radius: 8px; padding: 15px; text-align: center; position: relative; background: #fff;">
               <button type="button"
                       data-id="${urun.id}"
                       data-title="${urun.title.replace(/"/g, '&quot;')}"
                       data-img="${urun.img}"
                       data-price="${urun.price}"
                       onclick="window.yeniFavoriIslemi(event, this); setTimeout(window.hesabimFavorileriGoster, 100);"
                       style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                   <i class="fa-solid fa-heart" style="color: #D4AF37;"></i>
               </button>
               <img src="${urun.img}" alt="${urun.title}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">
               <h3 style="font-size: 15px; color: #333; margin-bottom: 5px;">${urun.title}</h3>
               <p style="font-weight: bold; color: #D4AF37; margin-bottom: 15px;">${urun.price} TL</p>
               <a href="urun.html?id=${urun.id}" style="display: block; background: #333; color: white; padding: 8px; border-radius: 5px; text-decoration: none; font-size: 13px; transition: background 0.3s;">Ürünü İncele</a>
           </div>
       `;
   });

   html += '</div>';
   icerikKutusu.innerHTML = html;
}

window.yeniFavoriIslemi = async function(event, btnElement) {
     if(event) {
         event.preventDefault();
         event.stopPropagation();
     }

     if (btnElement.disabled) return;
     btnElement.disabled = true;

     setTimeout(() => { btnElement.disabled = false; }, 1000);

     let id = btnElement.getAttribute("data-id");
     let title = btnElement.getAttribute("data-title");
     let img = btnElement.getAttribute("data-img");
     let price = parseFloat(btnElement.getAttribute("data-price"));

     let favoriler = JSON.parse(localStorage.getItem("lamasFavoriler")) || [];
     let index = favoriler.findIndex(f => f.id == id);
     let aktifKullanici = JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"));

     let icon = btnElement.querySelector("i");
     if (!icon) icon = btnElement;

     if(index > -1) {
         favoriler.splice(index, 1);
         icon.className = "fa-regular fa-heart";
         icon.style.color = "#777";
         btnElement.style.transform = "scale(1)";
         lamasBildirim("Ürün favorilerden çıkarıldı.", "uyari");
     } else {
         favoriler.push({ id: id, title: title, img: img, price: price });
         icon.className = "fa-solid fa-heart";
         icon.style.color = "#D4AF37";
         btnElement.style.transform = "scale(1.1)";
         lamasBildirim("Ürün favorilere eklendi!", "basarili");
     }

     localStorage.setItem("lamasFavoriler", JSON.stringify(favoriler));

     if (aktifKullanici && aktifKullanici.id) {
         try {
             await fetch("/api/favorites/toggle", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ userId: aktifKullanici.id, productId: parseInt(id), title: title, price: price, imgurl: img })
             });
         } catch (e) { console.log("DB Hatası", e); }
     }
};

function hesabimAdresleriGoster() {
    const icerikKutusu = document.querySelector(".account-content");

    // Aktif kullanıcının mevcut adresi varsa onu seçili yapmak için küçük bir hazırlık
    let mevcutIl = aktifKullanici.city || "";

    let iller = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara"
    ,"Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın",
    "Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce",
    "Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkâri","Hatay",
    "Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri",
    "Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin",
    "Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Siirt","Sinop",
    "Sivas","Şanlıurfa","Şırnak","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"];

    let optionsHtml = '<option value="" disabled selected>İl Seçiniz</option>';
    iller.forEach(il => {
        let seciliMi = (il === mevcutIl) ? "selected" : "";
        optionsHtml += `<option value="${il}" ${seciliMi}>${il}</option>`;
    });

    icerikKutusu.innerHTML = `
        <h2 class="content-title">Adres Bilgilerim</h2>
        <div class="user-info-box" style="display:flex; flex-direction:column; gap:15px;">
            <div>
                <label style="font-size:14px; font-weight:bold; color:#555;">İl</label>
                <select id="hesabimIl" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:5px; margin-top:5px;">
                    ${optionsHtml}
                </select>
            </div>
            <div>
                <label style="font-size:14px; font-weight:bold; color:#555;">İlçe</label>
                <input type="text" id="hesabimIlce" value="${aktifKullanici.district || ''}" placeholder="İlçe giriniz" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:5px; margin-top:5px;">
            </div>
            <div>
                <label style="font-size:14px; font-weight:bold; color:#555;">Açık Adres</label>
                <textarea id="hesabimAcikAdres" rows="3" placeholder="Mahalle, sokak, bina no..." style="width:100%; padding:10px; border:1px solid #ccc; border-radius:5px; margin-top:5px;">${aktifKullanici.address || ''}</textarea>
            </div>
            <button onclick="adresiGuncelle()" style="background:#D4AF37; color:#fff; border:none; padding:12px; border-radius:5px; font-weight:bold; cursor:pointer;">Adresi Kaydet</button>
        </div>
    `;
}

function adresiGuncelle() {
    let il = document.getElementById("hesabimIl").value;
    let ilce = document.getElementById("hesabimIlce").value;
    let adres = document.getElementById("hesabimAcikAdres").value;

    if(!il || !ilce || !adres) {
        alert("Lütfen tüm adres alanlarını doldurun.");
        return;
    }

    // Burada backend'e fetch ile güncelleme isteği atılmalı.
    // Şimdilik LocalStorage'ı güncelleyelim:
    aktifKullanici.city = il;
    aktifKullanici.district = ilce;
    aktifKullanici.address = adres;
    localStorage.setItem("lamasGirisYapanKullanici", JSON.stringify(aktifKullanici));

    alert("Adresiniz başarıyla güncellendi!");
}
window.hesapAdresiKaydet = async function(e) {
   e.preventDefault();
   let aktifKullanici = JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"));
   if(!aktifKullanici) return;

   let tel = document.getElementById("hesapTel").value.trim();
   let il = document.getElementById("hesapIl").value;
   let ilce = document.getElementById("hesapIlce").value.trim();
   let adres = document.getElementById("hesapAcikAdres").value.trim();

   try {
       let response = await fetch('/api/users/' + aktifKullanici.id + '/address', {
           method: "PUT",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ phone: tel, city: il, district: ilce, address: adres })
       });

       if(response.ok) {
           // 🌟 İŞTE EKSİK OLAN ZİNCİR: Tarayıcı Hafızasını (LocalStorage) Güncelle! 🌟
           aktifKullanici.phone = tel;
           aktifKullanici.city = il;
           aktifKullanici.district = ilce;
           aktifKullanici.address = adres;
           localStorage.setItem("lamasGirisYapanKullanici", JSON.stringify(aktifKullanici));

           lamasBildirim("Adresiniz başarıyla kaydedildi!", "basarili");
       } else {
           lamasBildirim("Adres güncellenirken bir hata oluştu.", "hata");
       }
   } catch(error) {
       lamasBildirim("Sunucu ile iletişim kurulamadı!", "hata");
   }
};
function adminUrunFiltrele() {
   let arananKelime = document.getElementById("admin-urun-ara").value.toLowerCase();
   let urunKutulari = document.getElementById("admin-urun-listesi").children;

   for (let i = 0; i < urunKutulari.length; i++) {
       let urunIcerigi = urunKutulari[i].innerText.toLowerCase();

       if (urunIcerigi.includes(arananKelime)) {
           urunKutulari[i].style.display = "";
       } else {
           urunKutulari[i].style.display = "none";
       }
   }
}

function patronIstatistikleriniGetir() {
    let siparisKutusu = document.getElementById("toplam-siparis");
    let ciroKutusu = document.getElementById("toplam-ciro");
    let urunKutusu = document.getElementById("toplam-urun");

    if(!siparisKutusu || !ciroKutusu || !urunKutusu) return;

    fetch("/api/orders")
        .then(response => {
            if (!response.ok) throw new Error("Java siparişleri vermedi, durum kodu: " + response.status);
            return response.json();
        })
        .then(siparisler => {
            if (Array.isArray(siparisler)) {
                // 1. ADIM: Sadece başarılı/ödenmiş siparişleri filtrele
                let gecerliSiparisler = siparisler.filter(siparis => {
                    // DİKKAT: Java tarafında durumu belirten değişkenin adını ve değerini buraya yazmalısın.
                    // Örneğin: siparis.status, siparis.durum veya siparis.orderStatus olabilir.
                    let durum = siparis.status; // Veritabanındaki kolon ismine göre burayı güncelle

                    return durum === "Sipariş Alındı" || durum === "Hazırlanıyor" || durum === "Kargoya Verildi" || durum === "Teslim Edildi";
                });

                // 2. ADIM: Sayı ve ciroyu sadece geçerli siparişler üzerinden hesapla
                siparisKutusu.innerText = gecerliSiparisler.length;

                let toplamKasa = gecerliSiparisler.reduce((toplam, siparis) => toplam + (siparis.totalAmount || 0), 0);
                ciroKutusu.innerText = toplamKasa.toLocaleString('tr-TR') + " ₺";
            } else {
                console.error("Beklenmeyen format geldi:", siparisler);
            }
        })
        .catch(err => console.log("Sipariş çekme hatası: ", err));

    fetch("/api/products")
        .then(response => response.json())
        .then(urunler => {
            if (Array.isArray(urunler)) {
                urunKutusu.innerText = urunler.length;
            }
        })
        .catch(err => console.log("Ürünler alınamadı: ", err));
}

document.addEventListener("DOMContentLoaded", function() {
   patronIstatistikleriniGetir();
});
document.addEventListener("DOMContentLoaded", function() {
   let dinamikKutu = document.getElementById("dinamik-urun-kutusu");
   let dinamikBaslik = document.getElementById("dinamik-baslik");

   if (dinamikKutu) {
       let urlParametreleri = new URLSearchParams(window.location.search);
       let seciliCinsiyet = urlParametreleri.get("cinsiyet");

       if (seciliCinsiyet) {
           if (dinamikBaslik) dinamikBaslik.innerText = seciliCinsiyet + " Parfümleri";
       }

       fetch("/api/products")
           .then(response => response.json())
           .then(urunler => {
               if (seciliCinsiyet) {
                   urunler = urunler.filter(parfum => parfum.gender === seciliCinsiyet);
               }

               if (urunler.length === 0) {
                   dinamikKutu.innerHTML = "<p style='text-align:center; width:100%; font-size:18px;'>Bu kategoride henüz parfüm bulunmamaktadır.</p>";
                   return;
               }

               let favoriler = JSON.parse(localStorage.getItem("lamasFavoriler")) || [];
               dinamikKutu.innerHTML = "";

               urunler.forEach(parfum => {
                   let favoriMi = favoriler.find(f => f.id == parfum.id);
                   let kalpClass = favoriMi ? "fa-solid" : "fa-regular";
                   let kalpRenk = favoriMi ? "#D4AF37" : "#777";

                   let kart = `
                       <div class="room-card" style="position: relative; cursor: pointer;" onclick="window.location.href='urun.html?id=${parfum.id}'">
                           <button type="button"
                                   data-id="${parfum.id}"
                                   data-title="${parfum.title.replace(/"/g, '&quot;')}"
                                   data-img="${parfum.imgurl}"
                                   data-price="${parfum.price}"
                                   onclick="window.yeniFavoriIslemi(event, this)"
                                   style="position: absolute; top: 15px; right: 15px; background: white; border: none; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 10; transition: transform 0.2s;">
                               <i class="${kalpClass} fa-heart" style="color: ${kalpRenk}; font-size: 18px; transition: all 0.3s;"></i>
                           </button>

                           <div class="img-room">
                               <img src="${parfum.imgurl}" alt="${parfum.title}">
                           </div>
                           <div class="img-info">
                               <h2>${parfum.title}</h2>
                               <p>${parfum.description}</p>
                               <a href="urun.html?id=${parfum.id}" class="room-gozat">Göz at</a>
                           </div>
                       </div>
                   `;
                   dinamikKutu.innerHTML += kart;
               });
           })
           .catch(error => console.error("Ürünler çekilemedi:", error));
   }
});

window.siparisPdfIndir = async function(siparisId, btnElement) {
    try {
        let response = await fetch("/api/orders/all");
        let siparisler = await response.json();
        let seciliSiparis = siparisler.find(s => s.id === siparisId);

        if(!seciliSiparis) {
            lamasBildirim("Sipariş bulunamadı!", "hata");
            return;
        }

        let tarihMetni = seciliSiparis.orderDate;
        let tarih = "";
        try {
            tarih = Array.isArray(tarihMetni)
                ? `${tarihMetni[2]}/${tarihMetni[1]}/${tarihMetni[0]} ${tarihMetni[3]}:${tarihMetni[4]}`
                : new Date(tarihMetni).toLocaleString('tr-TR');
        } catch(e) { tarih = "Tarih Bulunamadi"; }

        const trTemizle = (metin) => {
            if (!metin) return "";
            return metin.toString()
                .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
                .replace(/ü/g, 'u').replace(/Ü/g, 'U')
                .replace(/ş/g, 's').replace(/Ş/g, 'S')
                .replace(/ı/g, 'i').replace(/İ/g, 'I')
                .replace(/ö/g, 'o').replace(/Ö/g, 'O')
                .replace(/ç/g, 'c').replace(/Ç/g, 'C');
        };

        const { jsPDF } = window.jspdf;
               const doc = new jsPDF();

               doc.setTextColor(212, 175, 55);
               doc.setFontSize(24);
               doc.setFont("helvetica", "bold");
               doc.text("LAMAS PARFUM", 20, 20);

               doc.setTextColor(100, 100, 100);
               doc.setFontSize(12);
               doc.setFont("helvetica", "normal");
               doc.text("Siparis Ozeti / Teslimat Belgesi", 105, 28, null, null, "center");

               doc.setDrawColor(212, 175, 55);
               doc.setLineWidth(1);
               doc.line(20, 32, 190, 32);

               doc.setTextColor(50, 50, 50);
               doc.setFontSize(11);

               doc.setFont("helvetica", "bold");
               doc.text("Siparis No:", 20, 45);
               doc.setFont("helvetica", "normal");
               doc.text("#" + (seciliSiparis.orderCode || seciliSiparis.id), 50, 45);



               doc.setFont("helvetica", "bold");
               doc.text("Tarih:", 20, 52);
               doc.setFont("helvetica", "normal");
               doc.text(tarih, 50, 52);

               doc.setFont("helvetica", "bold");
               doc.text("Musteri Adi:", 20, 59);
               doc.setFont("helvetica", "normal");
               doc.text(trTemizle(seciliSiparis.customerName), 50, 59);

               doc.setFont("helvetica", "bold");
               doc.text("E-Posta:", 20, 66);
               doc.setFont("helvetica", "normal");
               doc.text(trTemizle(seciliSiparis.contactEmail || "Belirtilmedi"), 50, 66);



             if (seciliSiparis.trackingNumber) {
                         let canvas = document.createElement("canvas");
                         JsBarcode(canvas, seciliSiparis.trackingNumber, {
                             format: "CODE128",
                             displayValue: false, // Rakamları biz özel olarak jsPDF ile alt tarafa yazacağız
                             lineColor: "#000",
                             width: 2,
                             height: 40,
                             margin: 0
                         });
                         let barcodeImg = canvas.toDataURL("image/webp");

                         // Barkodu sağ üst tarafa (x: 130, y: 45) yerleştiriyoruz
                         doc.addImage(barcodeImg, "webp", 130, 10, 60, 12);

                         // Barkodun hemen altına (y: 65) Takip No'yu tam ortalayarak yazıyoruz
                         doc.setFontSize(10);
                         doc.setFont("helvetica", "bold");
                         doc.text(seciliSiparis.trackingNumber, 160, 27, null, null, "center");

                         // Font ayarlarını alttaki ürün listesi bozulmasın diye tekrar sıfırlıyoruz
                         doc.setFontSize(11);
                         doc.setFont("helvetica", "normal");
                     }

              doc.setFont("helvetica", "bold");
                      doc.text("Adres:", 20, 80);
                      doc.setFont("helvetica", "normal");
                      let splitAdres = doc.splitTextToSize(trTemizle(seciliSiparis.deliveryAddress), 140);
                      doc.text(splitAdres, 50, 80);

       let yPos = 78 + (splitAdres.length * 7);
               doc.setFontSize(14);
               doc.setFont("helvetica", "bold");
               doc.setTextColor(0, 0, 0);
               doc.text("Satin Alinan Urunler:", 20, yPos);

               doc.setDrawColor(200, 200, 200);
               doc.line(20, yPos + 2, 190, yPos + 2);

               yPos += 10;
               doc.setFontSize(11);
               doc.setFont("helvetica", "normal");

        if (seciliSiparis.items && seciliSiparis.items.length > 0) {
            seciliSiparis.items.forEach(item => {
                let urunAd = item.title || "Urun";
                let miktar = item.quantity || 1;
                let fiyat = item.price || 0;
                let beden = trTemizle(item.size || "Standart");

                doc.text(`${miktar} Adet - ${trTemizle(urunAd)} (${beden})`, 20, yPos);
                doc.text(`${fiyat * miktar} TL`, 175, yPos);
                yPos += 8;
            });
        } else {
            doc.text("Urun detayi bulunamadi.", 20, yPos);
            yPos += 8;
        }

        doc.line(20, yPos + 2, 190, yPos + 2);

        yPos += 12;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Genel Toplam:", 135, yPos);
        doc.setTextColor(212, 175, 55);
        doc.text(`${seciliSiparis.totalAmount} TL`, 170, yPos);

        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Bu belge Lamas Parfum sistemi tarafindan otomatik olusturulmustur.", 105, 280, null, null, "center");

      doc.save(`Lamas_Siparis_${seciliSiparis.orderCode || seciliSiparis.id}.pdf`);
              lamasBildirim("Fatura PDF olarak indirildi.", "basarili");

              // 🌟 YENİ EKLENEN: Butonu Yeşile Çevir ve Hafızaya Kaydet 🌟
              if (btnElement) {
                  btnElement.innerHTML = '<i class="fa-solid fa-check-double"></i> İndirildi';
                  btnElement.style.backgroundColor = '#27ae60'; // Yeşil renk

                  let indirilenler = JSON.parse(localStorage.getItem("lamasIndirilenPdfler")) || [];
                  if (!indirilenler.includes(siparisId.toString())) {
                      indirilenler.push(siparisId.toString());
                      localStorage.setItem("lamasIndirilenPdfler", JSON.stringify(indirilenler));
                  }
              }

          } catch (error) {
              console.error("PDF oluşturma hatası:", error);
              lamasBildirim("PDF oluşturulurken bir hata meydana geldi!", "hata");
          }
      };

document.addEventListener("DOMContentLoaded", () => {
    const track = document.getElementById('track');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (track && prevBtn && nextBtn) {
        let index = 0;
        const slides = document.querySelectorAll('#track .slide');
        let otoKaydirici;

        track.style.transition = "transform 0.5s ease-in-out";

        function slaytKaydir() {
            track.style.transform = `translateX(-${index * 100}%)`;
        }

        function otoKaydirmayiBaslat() {
            otoKaydirici = setInterval(() => {
                index++;
                if (index >= slides.length) index = 0;
                slaytKaydir();
            }, 4000);
        }

        function sayaciSifirla() {
            clearInterval(otoKaydirici);
            otoKaydirmayiBaslat();
        }

        otoKaydirmayiBaslat();

        nextBtn.addEventListener('click', () => {
            index++;
            if (index >= slides.length) index = 0;
            slaytKaydir();
            sayaciSifirla();
        });

        prevBtn.addEventListener('click', () => {
            index--;
            if (index < 0) index = slides.length - 1;
            slaytKaydir();
            sayaciSifirla();
        });
    }
});
// =======================================================
// KUSURSUZ DİL DEĞİŞTİRME MOTORU (ZOMBİ ÇEREZ KORUMALI)
// =======================================================
// =======================================================
// KUSURSUZ DİL DEĞİŞTİRME MOTORU (ZOMBİ ÇEREZ KORUMALI)
// =======================================================
window.dilDegistir = function(dil) {
    let alanAdi = window.location.hostname;

    if (dil === 'tr') {
        // Çerezleri her ihtimale karşı tüm varyasyonlarıyla temizle
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + alanAdi + "; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=." + alanAdi + "; path=/;";

        localStorage.removeItem("lamasSecilenDil");
        window.location.reload();
    } else {
        // İngilizce için çerez ataması
        document.cookie = "googtrans=/tr/" + dil + "; path=/;";
        document.cookie = "googtrans=/tr/" + dil + "; domain=" + alanAdi + "; path=/;";
        document.cookie = "googtrans=/tr/" + dil + "; domain=." + alanAdi + "; path=/;";

        localStorage.setItem("lamasSecilenDil", dil);
        window.location.reload();
    }
};

// ÇEVİRİ MOTORUNU SADECE İNGİLİZCE İSTENDİĞİNDE TETİKLEYEN KORUMA
document.addEventListener("DOMContentLoaded", () => {
    let seciliDil = localStorage.getItem("lamasSecilenDil");

    // Eğer kullanıcı İngilizce (EN) butonuna basmışsa motoru çalıştır
    if (seciliDil === "en") {
        window.googleTranslateElementInit = function() {
            new google.translate.TranslateElement({
                pageLanguage: 'tr',
                includedLanguages: 'en,tr',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE
            }, 'google_translate_element');
        };

        let script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        document.body.appendChild(script);
    }
});
// =======================================================
// MİSAFİRİ TEK TIKLA ÜYEYE ÇEVİRME MOTORU
// =======================================================
window.hizliUyeOl = async function() {
    let sifre = document.getElementById("hizliSifre").value;

    if(sifre.length < 8) {
        lamasBildirim("Lütfen en az 8 karakterli güvenli bir şifre belirleyin.", "uyari");
        return;
    }

    // DİKKAT: Ödeme sayfasında (HTML'de) müşteriden aldığın e-posta inputunun
    // id'sinin "iletisimMail" olduğunu varsayıyorum. HTML'de farklıysa burayı düzeltmelisin!
    let emailKutusu = document.getElementById("iletisimMail");
    let email = emailKutusu ? emailKutusu.value.trim() : "";

    if(!email) {
        lamasBildirim("Siparişte kullandığınız e-posta bulunamadı, normal kayıt sayfasını kullanın.", "hata");
        setTimeout(() => { window.location.href = "/"; }, 2000);
        return;
    }

    // Karttaki ismi (Örn: "Ahmet Yılmaz") Ad ve Soyad olarak ikiye ayırıyoruz
    let adSoyad = document.getElementById("cardName").value.trim();
    let ad = adSoyad.split(" ")[0] || "Misafir";
    let soyad = adSoyad.split(" ").slice(1).join(" ") || "Müşteri";

    let newUser = { name: ad, surname: soyad, email: email, password: sifre };

    try {
        lamasBildirim("Hesabınız oluşturuluyor, e-posta gönderiliyor...", "bilgi");

        let response = await fetch("/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser)
        });

        let result = await response.text();

        if(response.ok) {
            // Kayıt başarılı oldu, simsiyah ekranı harika bir karşılama mesajına çevir!
            document.getElementById("loadingEkrani").innerHTML = `
                <i class="fa-solid fa-envelope-open-text" style="color: #D4AF37; font-size: 80px; margin-bottom: 20px;"></i>
                <h2 style="color: #fff; margin-bottom: 15px; font-size: 28px;">Aramıza Hoş Geldiniz!</h2>
                <p style="color: #ccc; font-size: 16px; margin-bottom: 25px; max-width: 400px;">Hesabınız başarıyla oluşturuldu ve onay kodunuz <strong style="color:#D4AF37;">${email}</strong> adresine gönderildi.</p>
                <button onclick="window.location.href='giris.html'" style="background: #D4AF37; color: #111; padding: 12px 30px; font-weight: bold; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Giriş Sayfasına Git ve Onayla</button>
            `;
        } else {
            lamasBildirim(result, "hata"); // Örn: Bu mail zaten kayıtlı!
        }
    } catch(e) {
        lamasBildirim("Kayıt sırasında sunucu ile iletişim kurulamadı.", "hata");
    }
};
let koleksiyonKutusu = document.getElementById("koleksiyon-kutusu");
    let koleksiyonBaslik = document.getElementById("koleksiyon-baslik");

    if (koleksiyonKutusu) {
        let urlParametreleri = new URLSearchParams(window.location.search);
        let seciliFiltre = urlParametreleri.get("filtre");

        fetch("/api/products")
            .then(response => response.json())
            .then(urunler => {
                koleksiyonKutusu.innerHTML = ""; // Yükleniyor ikonunu sil
                let gosterilecekUrunler = [];

                if (seciliFiltre === "yeni") {
                    koleksiyonBaslik.innerText = "Yeni Gelenler";
                    gosterilecekUrunler = urunler.reverse().slice(0, 8);
                }
                else if (seciliFiltre === "populer") {
                    koleksiyonBaslik.innerText = "Çok Satanlar";
                    // MANUEL KONTROL: Çok satanların ID'lerini buraya yaz!
                    let vitrineCikacakIdler = ["1", "3", "5", "8"];
                    gosterilecekUrunler = urunler.filter(parfum => vitrineCikacakIdler.includes(parfum.id.toString()));
                }
                else {
                    koleksiyonBaslik.innerText = "Tüm Koleksiyon";
                    gosterilecekUrunler = urunler;
                }

                let favoriler = JSON.parse(localStorage.getItem("lamasFavoriler")) || [];

                gosterilecekUrunler.forEach(parfum => {
                    let favoriMi = favoriler.find(f => f.id == parfum.id);
                    let kalpClass = favoriMi ? "fa-solid" : "fa-regular";
                    let kalpRenk = favoriMi ? "#D4AF37" : "#777";

                    // SENİN ORİJİNAL KART YAPIN (Hiçbir style.css kuralı bozulmadan)
                    let kart = `
                        <div class="room-card" style="position: relative; cursor: pointer;" onclick="window.location.href='urun.html?id=${parfum.id}'">
                            <button type="button"
                                    data-id="${parfum.id}"
                                    data-title="${parfum.title.replace(/"/g, '&quot;')}"
                                    data-img="${parfum.imgurl}"
                                    data-price="${parfum.price}"
                                    onclick="window.yeniFavoriIslemi(event, this)"
                                    style="position: absolute; top: 15px; right: 15px; background: white; border: none; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 10; transition: transform 0.2s;">
                                <i class="${kalpClass} fa-heart" style="color: ${kalpRenk}; font-size: 18px; transition: all 0.3s;"></i>
                            </button>

                            <div class="img-room">
                                <img src="${window.kucukResimGetir(parfum.imgurl)}" onerror="this.onerror=null; this.src='${parfum.imgurl}';" alt="${parfum.title}" loading="lazy">
                            </div>
                            <div class="img-info">
                                <h2>${parfum.title}</h2>
                                <p>${parfum.description}</p>
                                <a href="urun.html?id=${parfum.id}" class="room-gozat">Göz at</a>
                            </div>
                        </div>
                    `;
                    koleksiyonKutusu.innerHTML += kart;
                });
            })
            .catch(error => {
                koleksiyonKutusu.innerHTML = "<p style='text-align:center;'>Ürünler yüklenirken bir hata oluştu.</p>";
            });
    }
   // =======================================================
       // 16. FAVORİLER SAYFASI (DİNAMİK ÇİZİM MOTORU)
       // =======================================================
       document.addEventListener("DOMContentLoaded", () => {
           let favorilerGrid = document.getElementById("favoriler-sayfasi-grid");
           let bosUyarisi = document.getElementById("bos-favori-uyarisi");

           if (favorilerGrid) {
               window.favorilerSayfasiniCiz = function() {
                   let favoriler = JSON.parse(localStorage.getItem("lamasFavoriler")) || [];

                   if (favoriler.length === 0) {
                       favorilerGrid.style.display = "none";
                       bosUyarisi.style.display = "flex";
                       return;
                   }

                   bosUyarisi.style.display = "none";
                   favorilerGrid.style.display = "grid";
                   favorilerGrid.innerHTML = "";

                   favoriler.forEach(urun => {
                       let imgUrl = window.kucukResimGetir(urun.img); // Thumbnail motoru

                       let kart = `
                           <div class="favorite-card">
                               <div class="fav-image-wrapper">
                                   <img src="${imgUrl}" onerror="this.onerror=null; this.src='${urun.img}';" alt="${urun.title}" loading="lazy">
                                   <button class="remove-fav-btn"
                                           data-id="${urun.id}"
                                           data-title="${urun.title.replace(/"/g, '&quot;')}"
                                           data-img="${urun.img}"
                                           data-price="${urun.price}"
                                           onclick="window.yeniFavoriIslemi(event, this); setTimeout(window.favorilerSayfasiniCiz, 100);"
                                           title="Favorilerden Çıkar">
                                       <i class="fa-solid fa-heart"></i>
                                   </button>
                               </div>
                               <div class="fav-info">
                                   <h3>${urun.title}</h3>
                                   <span class="fav-price">${parseFloat(urun.price).toLocaleString('tr-TR')} TL</span>

                                   <div class="fav-action-group">
                                       <a href="urun.html?id=${urun.id}" class="fav-btn-outline">Ürünü İncele</a>
                                       <button onclick="window.hizliSepeteEkle(${urun.id}, '${urun.title.replace(/"/g, '\\"')}', ${urun.price}, '${imgUrl}')" class="fav-add-cart-btn">
                                           Sepete Ekle
                                       </button>
                                   </div>
                               </div>
                           </div>
                       `;
                       favorilerGrid.innerHTML += kart;
                   });
               };
               // Sayfa yüklendiğinde motoru çalıştır
               window.favorilerSayfasiniCiz();
           }
       });

    // =======================================================
    // HIZLI SEPETE EKLE MOTORU (Favorilerden Tek Tıkla)
    // =======================================================
    window.hizliSepeteEkle = async function(id, title, price, imgurl) {
        let aktifKullanici = JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"));
        let adet = 1; // Favorilerden tıklandığında hep 1 adet eklenir
        let boyut = "Standart Boy"; // Varsayılan boyut

        if (aktifKullanici && aktifKullanici.id) {
            let gonderilecekUrun = {
                userId: aktifKullanici.id,
                productId: parseInt(id),
                title: title,
                size: boyut,
                price: parseFloat(price),
                quantity: adet,
                imgurl: imgurl
            };

            try {
                let response = await fetch("/api/cart/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(gonderilecekUrun)
                });
                if (response.ok) {
                    lamasBildirim(`${title} sepetinize eklendi!`, "basarili");
                    if(typeof window.sepetiSunucuylaSenkronizeEt === "function") window.sepetiSunucuylaSenkronizeEt();
                }
            } catch (error) { console.error("Sepete eklenemedi:", error); }

        } else {
                    let sepet = JSON.parse(localStorage.getItem("lamasSepet")) || [];
                    let varOlanUrun = sepet.find(item => item.id == id && item.size === boyut);

                    if(varOlanUrun) {
                        varOlanUrun.quantity += adet;
                    } else {
                        sepet.push({ id: id.toString(), title: title, size: boyut, price: parseFloat(price), quantity: adet, img: imgurl });
                    }
                    localStorage.setItem("lamasSepet", JSON.stringify(sepet));
                    lamasBildirim(`${title} sepetinize eklendi!`, "basarili");
                    if(typeof window.sepetiEkranaCiz === "function") window.sepetiEkranaCiz();
                    window.sepetSayaciniGuncelle(); // <--- BU SATIRI İÇERİYE ALDIK
                }
    };
// 🌟 GÖSTERİCİ: Sırası gelen medyanın resim mi video mu olduğunu anlayıp ekrana basar
window.medyayiGoster = function(index) {
    let medya = window.aktifMedya[index];
    let fotoEl = document.getElementById("urun-detay-foto");
    let videoEl = document.getElementById("urun-detay-video");

    if (!fotoEl || !videoEl || !medya) return;

    if (medya.tur === 'resim') {
        videoEl.style.display = "none"; // Videoyu sakla
        videoEl.pause(); // Arka planda çalışmasını durdur

        fotoEl.src = medya.url;
        fotoEl.style.display = "block"; // Fotoğrafı göster

    } else if (medya.tur === 'video') {
        // 🌟 KESİN ÇÖZÜM: Fotoğraf kaybolmadan hemen önce hem ENİNİ hem BOYUNU ölçüyoruz!
        let mevcutBoy = fotoEl.offsetHeight;
        let mevcutEn = fotoEl.offsetWidth;

        fotoEl.style.display = "none"; // Fotoğrafı sakla

        videoEl.src = medya.url;

        // Videonun hem enini hem boyunu milimi milimine fotoğrafa kilitliyoruz!
        if (mevcutBoy > 0 && mevcutEn > 0) {
            videoEl.style.height = mevcutBoy + "px";
            videoEl.style.width = mevcutEn + "px";
        }

        videoEl.style.display = "block"; // Videoyu göster
        videoEl.play(); // Videoyu otomatik başlat
    }
}

// 🌟 OKLARA TIKLANDIĞINDA YUMUŞAK EFEKTLE MEDYAYI DEĞİŞTİRİR
window.fotografDegistir = function(yon) {
    if (!window.aktifMedya || window.aktifMedya.length <= 1) return;

    window.aktifFotoIndex += yon;

    // Sonsuz döngü: Sona gelirse başa, baştaysa sona atlar
    if (window.aktifFotoIndex >= window.aktifMedya.length) {
        window.aktifFotoIndex = 0;
    } else if (window.aktifFotoIndex < 0) {
        window.aktifFotoIndex = window.aktifMedya.length - 1;
    }

    let fotoEl = document.getElementById("urun-detay-foto");
    let videoEl = document.getElementById("urun-detay-video");

    // Geçiş efekti için aktif olanı hafif şeffaf yapıyoruz
    if (fotoEl.style.display !== "none") fotoEl.style.opacity = "0.3";
    if (videoEl.style.display !== "none") videoEl.style.opacity = "0.3";

    // 150ms sonra yeni medyayı yükle ve görünürlüğünü %100 yap
    setTimeout(() => {
        window.medyayiGoster(window.aktifFotoIndex);
        fotoEl.style.opacity = "1";
        videoEl.style.opacity = "1";
    }, 150);
};
// =======================================================
// SEPET SAYACINI GÜNCELLEME MOTORU (NAVBAR İÇİN)
// =======================================================
// =======================================================
// SEPET SAYACINI GÜNCELLEME MOTORU (NAVBAR İÇİN)
// =======================================================
window.sepetSayaciniGuncelle = function() {
    let sepet = JSON.parse(localStorage.getItem("lamasSepet")) || [];
    let toplamUrunAdedi = 0;

    // Sepetteki tüm ürünlerin adetlerini topluyoruz
    sepet.forEach(item => {
        toplamUrunAdedi += parseInt(item.quantity) || 1;
    });

    let sayacElementi = document.getElementById("nav-sepet-sayaci");
    if (sayacElementi) {
        if (toplamUrunAdedi > 0) {
            sayacElementi.innerText = toplamUrunAdedi;
            sayacElementi.style.opacity = "1"; // Ürün varsa göster
        } else {
            sayacElementi.innerText = "0"; // Sayacı garanti sıfırla
            sayacElementi.style.opacity = "0"; // Ürün yoksa gizle
        }
    }
};
window.mobilMenuTetikle = function() {
    let menu = document.getElementById("mobilMenuListesi");
    menu.classList.toggle("aktif");
};
document.addEventListener("DOMContentLoaded", () => {

    // --- ÖDEME BAŞARILIYSA SEPETİ TEMİZLE ---
    let anaUrlParams = new URLSearchParams(window.location.search);
    if (anaUrlParams.get("odeme") === "basarili") {
        // 1. Yerel hafızayı (misafir sepetini) sil
        localStorage.removeItem("lamasSepet");
        localStorage.removeItem("lamasGeciciAdres");

        // 2. Kullanıcı giriş yapmışsa Java veritabanındaki sepetini de silmek için istek at
        let aktifKullanici = JSON.parse(localStorage.getItem("lamasGirisYapanKullanici"));
        if (aktifKullanici && aktifKullanici.id) {
            fetch("/api/cart/clear/" + aktifKullanici.id, { method: "DELETE" })
                .catch(err => console.log("Sepet temizleme hatası", err));
        }

        lamasBildirim("Ödemeniz başarıyla alındı! Siparişiniz hazırlanıyor.", "basarili");

        // 3. Ekranda sepeti boş göster ve URL'den 'odeme=basarili' yazısını sil
        if(typeof window.sepetiEkranaCiz === "function") window.sepetiEkranaCiz();
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // --- 1. SİSTEMİ ÇALIŞTIRAN ANA FONKSİYONLAR ---
    window.sepetSayaciniGuncelle();

});
// =======================================================
// YUKARI ÇIK BUTONU (SCROLL) MOTORU
// =======================================================
window.addEventListener('scroll', function() {
    let upBtn = document.getElementById("yukariCikBtn");
    if (upBtn) {
        // Kullanıcı 300px'den fazla aşağı indiyse butonu göster
        if (window.scrollY > 300) {
            upBtn.classList.add("goster");
        } else {
            // Tepeye yaklaştıysa tekrar gizle
            upBtn.classList.remove("goster");
        }
    }
});
document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactPageForm");

    if (contactForm) {
        contactForm.addEventListener("submit", async function(e) {
            e.preventDefault(); // Sayfanın yenilenmesini durdur

            // Inputlardaki verileri al
            let gonderilecekVeri = {
                name: document.getElementById("contactName").value.trim(),
                email: document.getElementById("contactEmail").value.trim(),
                subject: document.getElementById("contactSubject").value.trim(),
                message: document.getElementById("contactMessage").value.trim()
            };

            try {
                // Veriyi Java'ya fırlat
                let response = await fetch("/api/contact/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(gonderilecekVeri)
                });

                if (response.ok) {
                    window.lamasBildirim("Mesajınız başarıyla iletildi. Size en kısa sürede dönüş yapacağız!", "basarili");
                    contactForm.reset(); // Formu temizle
                } else {
                    window.lamasBildirim("Mesaj gönderilirken bir hata oluştu.", "hata");
                }
            } catch (err) {
                window.lamasBildirim("Sunucuya ulaşılamadı.", "hata");
            }
        });
    }
});
function adminMesajlariGetir() {
    let mesajTablo = document.getElementById("admin-mesaj-listesi");
    if (!mesajTablo) return;

    fetch("/api/contact/all") // Java'dan mesajları getireceğimiz rota
        .then(response => response.json())
        .then(data => {
            mesajTablo.innerHTML = "";

            if (data.length === 0) {
                mesajTablo.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Henüz gelen mesaj yok.</td></tr>";
                return;
            }

            // Mesajları sondan başa (en yeni en üstte) sırala
            data.reverse().forEach(mesaj => {
                let satir = `
                    <tr>
                        <td style="font-weight:bold;">${mesaj.name}</td>
                        <td><a href="mailto:${mesaj.email}" style="color: #007bff; text-decoration: none;">${mesaj.email}</a></td>
                        <td style="color:#D4AF37; font-weight:bold;">${mesaj.subject}</td>
                        <td style="font-size:14px; line-height:1.4;">${mesaj.message}</td>
                    </tr>
                `;
                mesajTablo.innerHTML += satir;
            });
        })
        .catch(error => console.error("Mesajlar çekilemedi:", error));
}
window.siparisIadeEt = async function(id) {
    if (!confirm("Sipariş ücreti müşterinin kredi kartına iade edilecektir. Onaylıyor musunuz?")) return;

    try {
        let response = await fetch("/api/kuveytturk/refund/" + id, { method: "POST" });
        if (response.ok) {
            lamasBildirim("Para iadesi kartına yansıtıldı!", "basarili");
            adminSiparisleriGetir();
        } else {
            lamasBildirim("Banka iade işlemini onaylamadı.", "hata");
        }
    } catch (error) {
        lamasBildirim("İade servisine ulaşılamadı.", "hata");
    }
};

// =======================================================
// CANLI ARAMA MOTORU (LIVE SEARCH)
// =======================================================
let tumUrunlerAramaIcin = [];

// Arama kutusunu açma/kapama
window.aramaKutusunuAc = function(event) {
    event.preventDefault();
    let aramaKutusu = document.getElementById("aramaKutusu");
    let aramaInput = document.getElementById("aramaInput");

    aramaKutusu.classList.toggle("aktif");

    // Kutu açıldığında ürünleri veritabanından bir kere çekip hafızaya al
    if (aramaKutusu.classList.contains("aktif")) {
        aramaInput.focus();
        if (tumUrunlerAramaIcin.length === 0) {
            fetch("/api/products")
                .then(res => res.json())
                .then(data => tumUrunlerAramaIcin = data)
                .catch(err => console.error("Arama için ürünler çekilemedi:", err));
        }
    }
};

// Sayfada boş bir yere tıklanınca arama kutusunu kapat
document.addEventListener("click", function(event) {
    let aramaKapsayici = document.querySelector(".arama-kapsayici");
    let aramaKutusu = document.getElementById("aramaKutusu");

    if (aramaKapsayici && !aramaKapsayici.contains(event.target)) {
        if (aramaKutusu) aramaKutusu.classList.remove("aktif");
    }
});

// Kullanıcı yazı yazdıkça tetiklenen arama fonksiyonu
window.canliUrunAra = function() {
    let kelime = document.getElementById("aramaInput").value.toLowerCase().trim();
    let sonucKutusu = document.getElementById("aramaSonuclari");

    sonucKutusu.innerHTML = ""; // Önceki sonuçları temizle

    if (kelime.length < 2) return; // En az 2 harf yazılmasını bekle

    // Ürünlerde başlık, kategori veya notalarda arama yap
    let eslesenUrunler = tumUrunlerAramaIcin.filter(urun => {
        let baslikUyumu = urun.title && urun.title.toLowerCase().includes(kelime);
        let kategoriUyumu = urun.category && urun.category.toLowerCase().includes(kelime);
        let notaUyumu = (urun.topNotes && urun.topNotes.toLowerCase().includes(kelime)) ||
                        (urun.middleNotes && urun.middleNotes.toLowerCase().includes(kelime)) ||
                        (urun.baseNotes && urun.baseNotes.toLowerCase().includes(kelime));

        return baslikUyumu || kategoriUyumu || notaUyumu;
    });

    if (eslesenUrunler.length === 0) {
        sonucKutusu.innerHTML = `<p style="text-align:center; color:#777; font-size:13px; padding:10px;">Sonuç bulunamadı.</p>`;
        return;
    }

    // Bulunan ürünleri HTML olarak ekrana bas
    eslesenUrunler.forEach(urun => {
        let linkHTML = `
            <a href="urun.html?id=${urun.id}" class="arama-sonuc-karti">
                <img src="${window.kucukResimGetir(urun.imgurl)}" onerror="this.onerror=null; this.src='${urun.imgurl}';" alt="${urun.title}" class="arama-sonuc-img" loading="lazy">
                <div class="arama-sonuc-bilgi">
                    <h4>${urun.title}</h4>
                    <p>${urun.price} TL</p>
                </div>
            </a>
        `;
        sonucKutusu.innerHTML += linkHTML;
    });
};

window.kucukResimGetir = function(orijinalUrl) {
    if (!orijinalUrl) return "";
    if (orijinalUrl.includes("_thumb")) return orijinalUrl;

    let noktaIndex = orijinalUrl.lastIndexOf(".");
    if (noktaIndex === -1) return orijinalUrl;

    // Orijinal uzantıyı (.webp) alıyoruz
    let uzanti = orijinalUrl.substring(noktaIndex);
    let isimKismi = orijinalUrl.substring(0, noktaIndex);

    // Orijinal uzantıyı koruyarak _thumb ekliyoruz
    return isimKismi + "_thumb" + uzanti;
};

// =======================================================
// SOSYAL MEDYA GİRİŞ İŞLEMLERİ (GOOGLE & APPLE)
// =======================================================
window.googleIleGirisYap = function() {
    window.lamasBildirim("Google sunucularına bağlanılıyor...", "bilgi");

    // Spring Boot standart Google OAuth2 giriş noktasına yönlendirir
    setTimeout(() => {
        window.location.href = "/oauth2/authorization/google";
    }, 1000);
};

window.appleIleGirisYap = function() {
    window.lamasBildirim("Apple sunucularına bağlanılıyor...", "bilgi");

    // Spring Boot standart Apple OAuth2 giriş noktasına yönlendirir
    setTimeout(() => {
        window.location.href = "/oauth2/authorization/apple";
    }, 1000);
};