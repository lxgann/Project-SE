**DAFTAR ISI**

| DAFTAR ISI DAFTAR GAMBAR (Optional jika ada) DAFTAR TABEL (Optional jika ada) DAFTAR LAMPIRAN |  | i ii iii iv |
| :---- | :---- | :---: |
| **BAB 1\. PENDAHULUAN** Latar Belakang Tujuan Prediksi Manfaat 1.4 Luaran |  | 1 1 1 2 2 |
| **BAB 2\. TINJAUAN PUSTAKA** 2.1 Arsitektur Sistem Web Tiga Lapis (Three-Tier Client-Server) 2.2 Pemrosesan Dokumen Lokal Tanpa Kecerdasan Buatan (Deterministic Parsing) 2.3 Komunikasi Dupleks Penuh (Full-Duplex) Real-Time via WebSockets |  | 3 3 3 3 |
| **BAB 3\. TAHAP PELAKSANAAN** 3.1 Deskripsi Sistem 3.2 Alur dan Tahapan Pelaksanaan 3.3 Perancangan Produk/Alat/Sistem 3.4 Pengujian |  | 4 4 5 6 6 |
| **BAB 4\. BIAYA DAN JADWAL KEGIATAN** |  | 7 |
|  | 4.1 Anggaran Biaya 4.2 Jadwal Kegiatan  | 7 8 |
| **DAFTAR PUSTAKA** |  | 9 |
| **LAMPIRAN**  Lampiran 1\. Biodata Ketua dan Anggota, serta Dosen Pendamping Lampiran 2\. Justifikasi Anggaran Kegiatan Lampiran 3\. Susunan Tim Pengusul dan Pembagian Tugas Lampiran 4\. Surat Pernyataan Ketua Pengusul Lampiran 5\. Gambaran Teknologi yang akan Dikembangkan Lampiran 6\. Hasil Uji Periksa Similaritas Proposal  |  | 10 10 13 15 14 17 18  |

**BAB 1\. PENDAHULUAN**  
**1.1 Latar Belakang**

Di era transformasi digital saat ini, kebutuhan akan media edukasi dan sarana pengujian pengetahuan yang interaktif serta rekreatif semakin meningkat. Namun, realitas di lapangan menunjukkan bahwa metode penyampaian materi pembelajaran digital saat ini masih didominasi oleh konsumsi konten pasif satu arah. Pengguna atau peserta didik seringkali hanya membaca dokumen teks baku seperti dokumen teks (.txt), PDF, atau DOCX tanpa adanya mekanisme evaluasi yang interaktif, sehingga menurunkan tingkat retensi memori dan pemahaman terhadap materi tersebut.

Meskipun terdapat platform e-learning dan Learning Management System (LMS) formal, sebagian besar sistem tersebut bersifat kaku, kurang mengadopsi elemen permainan (gamifikasi), serta membutuhkan waktu yang relatif lama bagi pengajar (uploader) untuk menyusun bank soal secara manual. Mengubah materi teks tebal menjadi kuis interaktif mengharuskan pengajar menyalin teks satu per satu, yang berujung pada tidak efisiennya proses evaluasi. Di sisi lain, aplikasi kuis gamifikasi komersial yang ada saat ini seringkali memiliki ketergantungan yang tinggi pada jaringan luar, skema langganan berbayar, atau integrasi API kecerdasan buatan (AI) pihak ketiga yang rentan terhadap masalah latensi dan biaya operasional.

Oleh karena itu, diusulkan sebuah karsa cipta berupa GameGuessr, sebuah platform web kuis interaktif mandiri (self-contained) yang berjalan tanpa ketergantungan API AI pihak ketiga. Platform ini menjembatani celah antara pembagian konten pasif dengan penilaian interaktif melalui implementasi algoritma pembaca teks deterministik (deterministic text parser). Melalui sistem ini, dokumen teks yang diunggah dapat diekstrak secara lokal menjadi soal-soal kuis pilihan ganda yang siap dimainkan dalam lingkungan permainan berbasis sinkronisasi waktu nyata (real time execution).

**1.2 Tujuan**

1. Merancang dan mengimplementasikan sistem pembaca teks deterministik (parseStructuredText) lokal yang mampu mengekstrak file bertipe .txt, .pdf, .docx, dan .json menjadi struktur soal kuis pilihan ganda dwibahasa secara otomatis.  
2. Membangun modul kuis berbasis komunikasi WebSocket (Socket.io) untuk sinkronisasi penghitung waktu mundur (timer) per peserta demi meminimalkan celah kecurangan.  
3. Mewujudkan sistem papan peringkat (leaderboard) dinamis dan riwayat performa yang mengintegrasikan algoritma kalkulasi skor berdasarkan akurasi dan kecepatan respon secara instan.

**1.3 Preediksi Manfaat**

1. Bagi Content Uploader/Pengajar: Memangkas waktu penyusunan kuis secara signifikan melalui otomatisasi ekstraksi berkas materi lokal menjadi bank soal yang siap saji.  
2. Bagi Participant/Peserta Didik: Mengubah aktivitas membaca pasif menjadi pengalaman kompetitif yang interaktif melalui fitur streak combo dan animasi umpan balik, sehingga meningkatkan retensi pengetahuan.  
3. Bagi Lembaga Pendidikan: Menyediakan alternatif teknologi komplemen edukasi berbasis web yang murah, ringan, aman (terenkripsi JWT dan bebas injeksi SQL), serta tidak membutuhkan alokasi biaya API eksternal.

**1.4 Luaran**

Luaran wajib yang ditargetkan dari pelaksanaan progress PKM-KC ini adalah:

1. Laporan Kemajuan pelaksanaan program karsa cipta.  
2. Laporan Akhir keseluruhan program.  
3. Produk Prototipe Aplikasi Berbasis Web GameGuessr (v1.0.0-MVP) yang siap diakses secara lokal maupun cloud hosting.  
4. Artikel Ilmiah hasil pengujian keandalan sistem untuk diseminasikan pada seminar/konferensi nasional.

**BAB 2\. TINJAUAN PUSTAKA**  
**2.1 Arsitektur Sistem Web Tiga Lapis (Three-Tier Client-Server)** 

Aplikasi web modern umumnya menerapkan arsitektur tiga lapis demi menjaga aspek pemeliharaan (maintainability) dan keterujian (testability). GameGuessr didesain secara mandiri dengan pembagian peran sebagai berikut:

* Presentation Tier (Frontend): Berupa Single-Page Application (SPA) berbasis React 18 dengan Vite 8.x sebagai alat kompilasi untuk menjamin kecepatan pemuatan aset visual di peramban pengguna.  
* Application Tier (Backend): Berbasis Node.js 22 LTS dengan framework Express.js yang menangani manajemen routing REST API dan Socket.io untuk transmisi data real-time.  
* Data Tier: Menggunakan sistem manajemen database relasional MySQL 8.4 untuk persistensi data terstruktur.

**2.2 Pemrosesan Dokumen Lokal Tanpa Kecerdasan Buatan (Deterministic Parsing)** 

	Ketergantungan terhadap Large Language Model (LLM) atau API AI eksternal memicu kerentanan berupa biaya tinggi, risiko kebocoran data materi, serta sifat output yang tidak konsisten (hallucination). GameGuessr memecahkan masalah ini dengan menerapkan deterministic text parser lokal. Menggunakan pustaka pendukung seperti pdf-parse untuk dokumen PDF dan mammoth untuk dokumen DOCX, sistem mengekstrak string teks biner murni. Teks kemudian dibaca menggunakan fungsi pencocokan kata kunci terstruktur (seperti kata kunci Question, Question\_EN, A, B, C, D, Answer) untuk dipetakan secara langsung menjadi objek soal pilihan ganda di database tanpa koneksi internet luar. 

**2.3 Komunikasi Dupleks Penuh (Full-Duplex) Real-Time via WebSockets** 

	Permainan kuis kompetitif memerlukan keadilan dalam sinkronisasi waktu antar pemain. Protokol HTTP konvensional yang bersifat request-response tidak mampu menangani hitung mundur serentak karena tingginya beban latensi. Pustaka Socket.io berbasis protokol WebSocket menyediakan saluran komunikasi dua arah secara terus-menerus (persistent connection). Server mempertahankan kendali utama atas master timer dan memancarkan (broadcast) acara timer:sync setiap detik ke kamar (room) kuis spesifik. Hal ini mencegah manipulasi kode timer di sisi browser klien.

**BAB 3\. TAHAP PELAKSANAAN**  
**3.1 Deskripsi Produk Sistem** 

GameGuessr adalah sebuah platform web kuis interaktif responsif yang mengusung estetika desain dark-mode glassmorphism. Sistem terbagi ke dalam tiga modul utama, yaitu:

1. Modul Uploader: Antarmuka bagi pengajar untuk menyeret dan melepaskan (drag-and-drop) file berkas dengan ukuran maksimal 10 MB, melakukan konfigurasi batas waktu (15-120 detik), serta melakukan penyuntingan draf bank soal sebelum dipublikasi.   
2. Modul Quiz: Ruang interaktif bagi peserta untuk menjawab pertanyaan teracak (menggunakan fungsi ORDER BY RAND()). Dilengkapi animasi streak combo (jika benar lebih dari 3x beruntun) serta umpan balik suara (correct.mp3/wrong.mp3).   
3. Modul Leaderboard: Klaster penghitungan peringkat global dan spesifik kuis dengan aturan pengurutan berdasarkan skor tertinggi, dan jika terjadi seri, dihitung berdasarkan waktu penyelesaian tersingkat. 

**3.2 Alur dan Tahap Pelaksanaan**  
	Sesuai dengan rancangan *Software Development Life Cycle* (SDLC), program karsa cipta ini dijalankan dengan menerapkan *Incremental Process Model*. Model ini dipilih agar fungsionalitas sistem dapat dikembangkan secara bertahap dan diuji secara berkala untuk meminimalkan kegagalan sistem terintegrasi. Pelaksanaan program karsa cipta terbagi ke dalam 5 bulan eksekusi dengan rincian kegiatan terperinci sebagai berikut:

1. **Bulan 1 dan Bulan 2 (Fase Inisiasi, Analisis Kebutuhan, dan Perancangan Arsitektur):**
   Pada fase awal ini, tim fokus pada pendefinisian spesifikasi teknis dan cetak biru arsitektur sistem. Kegiatan utama meliputi:
   * **Analisis Kebutuhan Pengguna (*User Requirements Analysis*):** Mengidentifikasi hak akses dan kebutuhan dari tiga peran pengguna utama: *Participant* (pemain kuis), *Uploader* (pengajar/pembuat konten yang mengunggah materi), dan *Admin* (pengelola sistem).
   * **Pemodelan Struktur Data & Basis Data Relasional (MySQL):** Merancang skema basis data relasional (*Entity-Relationship Diagram* / ERD) yang efisien untuk persistensi data terstruktur. Skema ini diwujudkan ke dalam 6 tabel utama:
     * Tabel `users`: Menyimpan kredensial login (email, username unik, password terenkripsi), nama tampilan, peran pengguna (*enum role*), avatar, serta status keaktifan akun.
     * Tabel `quizzes`: Menyimpan metadata kuis seperti judul dan deskripsi dalam dua bahasa (ID & EN), tag kategori, batas waktu pengerjaan soal (*time limit*), status publikasi, dan referensi pembuat kuis (*foreign key* ke `users.id`).
     * Tabel `questions`: Menyimpan data soal kuis pilihan ganda dwibahasa (ID & EN), opsi jawaban A, B, C, D beserta terjemahannya, tautan gambar opsional (`image_url`), serta kunci jawaban benar (`correct_option` berupa karakter tunggal 'A', 'B', 'C', atau 'D').
     * Tabel `scores`: Mencatat pencapaian pemain (skor final, durasi pengerjaan, dan stempel waktu selesai) dengan indeks unik kombinasi `user_id` dan `quiz_id` untuk memastikan satu partisipan hanya memiliki satu rekaman skor final per kuis.
     * Tabel `quiz_sessions`: Melacak sesi permainan aktif partisipan untuk mendeteksi status pengerjaan kuis.
     * Tabel `audit_log`: Digunakan oleh administrator untuk mencatat log audit tindakan administratif demi keamanan sistem.
   * **Pemodelan Alur Perangkat Lunak:** Membuat rancangan UML (*Unified Modeling Language*) meliputi *Use Case Diagram*, *Activity Diagram* untuk alur parsing dokumen dan pengerjaan kuis, serta *Sequence Diagram* untuk menggambarkan transmisi data real-time melalui protokol WebSocket.
   * **Penetapan Arsitektur Sistem:** Menyepakati pemisahan modul menggunakan arsitektur *Three-Tier Client-Server*. Server API diposisikan sebagai perantara independen yang berkomunikasi menggunakan format JSON, memastikan portabilitas dan isolasi data yang aman.

2. **Bulan 3 (Fase Perancangan Antarmuka - UI/UX):**
   Fase ini berfokus pada visualisasi antarmuka pengguna agar menarik, interaktif, dan intuitif. Langkah-langkahnya meliputi:
   * **Pembuatan Wireframe dan High-Fidelity Mockups:** Merancang tata letak halaman menggunakan perangkat desain Figma. Desain menerapkan konsep modern *dark-mode glassmorphism* dengan karakteristik latar belakang gelap yang dikombinasikan dengan panel kaca semi-transparan (*backdrop blur*), border neon lembut sebagai aksen warna, dan tipografi sans-serif modern (Inter / Roboto) untuk meningkatkan keterbacaan.
   * **Perancangan Modul Halaman:**
     * Halaman Autentikasi: Login dan pendaftaran (*Signup*) yang responsif.
     * Halaman Utama (*Home*): Galeri kartu kuis (kuis yang telah dipublikasikan) dengan fitur pencarian dan penyaringan berdasarkan tag kategori (seperti RPG, Adventure, PC).
     * Halaman Unggah Dokumen (*Upload*): Antarmuka khusus uploader yang dilengkapi dengan area seret-dan-lepas (*drag-and-drop zone*) file serta slider pengaturan parameter kuis.
     * Halaman Bermain Kuis (*Play Page*): Panel permainan interaktif yang menampilkan hitung mundur waktu, indikator *streak combo*, efek transisi dinamis, dan integrasi visual media gambar pendukung soal.
     * Halaman Papan Peringkat (*Leaderboard*): Tampilan tabel peringkat partisipan yang diurutkan berdasarkan skor tertinggi dan durasi penyelesaian tercepat secara real-time.
     * Halaman Profil: Tampilan statistik performa pemain (skor akumulatif dan riwayat pengerjaan kuis).
     * Panel Admin: Antarmuka untuk manajemen data pengguna, moderasi kuis, dan pemantauan log audit.

3. **Bulan 4 (Fase Pengerjaan Teknis / Kode Program - Increment 1, 2, dan 3):**
   Tahap ini adalah implementasi kode program nyata untuk backend, basis data, dan frontend.
   * **Backend Development (Node.js & Express.js):**
     * **Setup REST API & Routing:** Membuat rute API untuk `/api/auth` (autentikasi), `/api/quizzes` (manajemen kuis dan soal), `/api/upload` (pemrosesan berkas), dan `/api/admin` (kontrol administratif).
     * **Keamanan Sistem:** Memasang middleware `helmet` untuk menyuntikkan HTTP *security headers*, menerapkan pembatasan laju permintaan (*rate limiting*) melalui `express-rate-limit` pada rute autentikasi untuk mencegah serangan *brute force*, serta enkripsi kata sandi satu arah menggunakan pustaka `bcrypt` dan manajemen otorisasi state-less dengan JSON Web Token (JWT).
     * **Deterministic Parser & AI Fallback:**
       * Mengembangkan fungsi ekstraksi berkas lokal menggunakan pustaka `pdf-parse` untuk membaca konten biner PDF dan `mammoth` untuk mengekstrak string teks dari file DOCX secara luring (*offline*).
       * Implementasi fungsi pembaca terstruktur deterministik (`parseStructuredText`) menggunakan aturan kecocokan pola ekspresi reguler (Regex) untuk mengenali sintaks pemisah pertanyaan (`Question:`, `Question_EN:`, opsi jawaban `A:` hingga `D:` beserta terjemahannya `A_EN:` hingga `D_EN:`, petunjuk gambar `Image:`, dan kunci jawaban `Answer:`).
       * Menyertakan modul kecerdasan buatan (*AI Fallback*) terintegrasi dengan Groq SDK menggunakan model `llama-3.3-70b-versatile` untuk menggenerasi bank kuis secara otomatis apabila file dokumen yang diunggah berupa teks paragraf bebas (bukan format terstruktur) dan kunci API eksternal tersedia. Jika kunci API tidak ada, sistem akan menjalankan algoritma ekstraksi kata kunci lokal (*local keyword fallback*) untuk menyusun draf pertanyaan.
     * **Sinkronisasi WebSocket Real-Time:** Membangun *socket server* menggunakan `socket.io` untuk menangani sinkronisasi waktu mundur permainan kuis secara tersentralisasi. Ketika uploader memulai kuis, server mengaktifkan pewaktu internal (`setInterval`) dan memancarkan event `timer:sync` ke ruang obrolan WebSocket (`quiz_${quizId}`) setiap 1 detik. Partisipan mengirimkan jawaban via event `answer:submit`, dan server memproses persistensi skor secara instan ke tabel `scores`.
   * **Frontend Development (React 18 & Vite):**
     * **State & Route Management:** Konfigurasi perutean SPA menggunakan `react-router-dom` dan pengaturan state global melalui Context API untuk autentikasi user (`AuthContext`), pelokalan bahasa (`LanguageContext` untuk dukungan dwibahasa ID/EN melalui integrasi kamus lokal), dan pesan notifikasi melayang (`SnackbarContext`).
     * **Integrasi UI Kuis & Aset Visual:**
       * Pembangunan halaman `Play.jsx` yang mengintegrasikan pemutaran efek suara (SFX *correct*, *incorrect*, *tick* untuk 5 detik terakhir, dan *click* tombol), animasi pembakar streak combo dinamis (pemberian efek api visual ketika berhasil menjawab benar lebih dari 3 kali secara beruntun), dan animasi konfeti (*victory confetti*) berbasis HTML5 Canvas yang meriah ketika kuis berhasil diselesaikan.
       * Pembangunan halaman `Upload.jsx` dengan antarmuka penyunting soal interaktif yang memungkinkan uploader untuk mereview, memodifikasi, menambah, atau menghapus pertanyaan hasil ekstraksi dokumen sebelum disimpan ke database.
   * **Integration & QA Awal:** Melakukan integrasi API dengan antarmuka React serta melakukan peninjauan kualitas kode untuk memastikan fungsionalitas dasar seperti registrasi, pengunggahan berkas, pemrosesan ekstraksi teks, dan alur pengerjaan kuis berjalan lancar tanpa *runtime error*. Tim juga memastikan pembersihan timer aktif di memori server ketika koneksi socket terputus (*disconnect* atau *leave_session*) demi mencegah terjadinya kebocoran memori (*memory leaks*).

4. **Bulan 5 (Fase Integrasi Lanjutan, Pengujian Sistem, dan Finalisasi):**
   Fase akhir sebelum perilisan prototipe karsa cipta.
   * **Pengujian Kualitatif (Usability Testing / UAT):** Melakukan uji coba kegunaan kepada 3 partisipan baru yang bertindak sebagai *Guest/Player*. Pengguna diminta untuk mendaftarkan akun secara mandiri, memilih kuis di halaman utama, dan menyelesaikan permainan kuis dalam batas waktu kurang dari 5 menit tanpa intervensi tim pengembang.
   * **Pengujian Kuantitatif (Performance & Security Testing):**
     * *Load Testing:* Menggunakan utilitas uji beban seperti `k6` atau `Artillery` untuk menyimulasikan 50-100 koneksi WebSocket konkuren yang aktif secara bersamaan, dengan target utilisasi CPU server di bawah 70% dan waktu respons REST API di bawah 300 milidetik.
     * *Network Latency:* Memantau latensi pengiriman paket WebSocket pada jaringan seluler 4G dengan toleransi keterlambatan maksimal 200 ms.
     * *Security Validation:* Menguji kerentanan eksploitasi umum seperti injeksi SQL (SQL Injection), pemalsuan permintaan situs silang (CSRF), dan validasi header HTTP.
   * **Final Bug Fixing & Deployment:** Memperbaiki bug visual maupun fungsional yang ditemukan selama pengujian. Melakukan deployment ke *production environment* menggunakan Cloud VPS Linux, dikonfigurasikan dengan reverse proxy Nginx untuk penanganan enkripsi SSL dan PM2 untuk menjaga keandalan proses backend Node.js agar berjalan secara terus-menerus (*always-on*).
   * **Manual Book & Final Report:** Menyusun buku panduan instalasi dan penggunaan aplikasi (*Manual Book*) serta laporan akhir kegiatan sebagai dokumentasi formal luaran PKM-KC.

**3.3 Perancangan Produk / Alat Sistem**

	Berikut adalah gambaran cetak biru teknis perancangan GameGuessr berdasarkan dokumen analisis model proyek:

**A. Skema Database Relasional (Entity Model)**

* Tabel users: ID (PK), username (Unique), email (Unique), password, role, is\_active, created\_at.  
* Tabel quizzes: ID (PK), title, description, category\_tags, time\_limit, status, created\_by (FK users.id)   
* Tabel questions: ID (PK), quiz\_id (FK quizzes.id), question\_text, option\_a, option\_b, option\_c, option\_d, correct\_option.   
* Tabel scores: ID (PK), user\_id (FK users.id), quiz\_id (FK quizzes.id), score, time\_taken, finished\_at.

**B. Logika Pengkodean Utama Node.js (Fungsi Parser Berkas Teks \- .txt)**

function parseStructuredText(rawText) {

    const questions \= \[\];

    const blocks \= rawText.split('\# (baris kosong antara pertanyaan)').filter(Boolean);

    blocks.forEach(block \=\> {

        const lines \= block.split('\\n').map(line \=\> line.trim()).filter(Boolean);

        let qObj \= { options: {} };

        

        lines.forEach(line \=\> {

            if (line.startsWith('Question:')) qObj.questionText \= line.replace('Question:', '').trim();

            else if (line.startsWith('A:')) qObj.options.A \= line.replace('A:', '').trim();

            else if (line.startsWith('B:')) qObj.options.B \= line.replace('B:', '').trim();

            else if (line.startsWith('C:')) qObj.options.C \= line.replace('C:', '').trim();

            else if (line.startsWith('D:')) qObj.options.D \= line.replace('D:', '').trim();

            else if (line.startsWith('Answer:')) qObj.correctOption \= line.replace('Answer:', '').trim();

        });

        if(qObj.questionText && qObj.correctOption) questions.push(qObj);

    });

    return questions;

}

**3.4 Pengujian (Testing)**

	Proses pengujian dilakukan menggunakan dua metode pengujian utama guna memvalidasi fungsionalitas dan non-fungsionalitas sistem:

1. Pengujian Kualitatif (Usability Testing):  
* Mengundang 3 pengguna perwakilan untuk bertindak sebagai Guest baru.  
* Parameter Keberhasilan: Pengguna harus mampu mendaftar akun, menjelajahi daftar kuis (browse), memilih kategori, dan menyelesaikan permainan kuis secara mandiri tanpa panduan luar dalam batas waktu standar kurang dari 5 menit.  
2. Pengujian Kuantitatif (Performance & Security Testing):  
* Load Testing (Uji Beban): Menggunakan alat bantu pengujian beban (k6 atau Artillery) untuk menyimulasikan 50-100 koneksi WebSocket konkuren aktif secara bersamaan. Target performa adalah utilisasi CPU server kurang dari 70% dan waktu respon REST API di bawah 300 ms.  
* Latensi Jaringan: Memantau keterlambatan pengiriman event question:new via WebSocket dengan batas toleransi maksimal 200 ms pada simulasi koneksi 4G.  
* Security Validation: Memastikan pustaka Helmet.js berhasil menyuntikkan HTTP security headers serta menguji parameter kueri database untuk menjamin kekebalan total dari manipulasi SQL Injection.

**BAB 4\. BIAYA DAN JADWAL KEGIATAN**  
**4.1 	Anggaran Biaya**

| No | Jenis Pengeluaran | Sumber Dana | Besaran Dana (Rp) |
| ----- | :---- | ----- | ----- |
| 1 | Bahan habis pakai (contoh: Kertas cetak dokumen/poster, ATK, modul pendukung, dl) maksimum 60% dari jumlah dana yang diusulkan | Belmawa | 4.800.000 |
|  |  | Perguruan Tinggi | \- |
|  |  | Instansi Lain (Jika ada) | \- |
| 2 | Sewa dan jasa (Adaptasi dari: Sewa Cloud VPS 6 bulan, Domain .com, & SSL Certificate), maksimum 15% dari jumlah dana yang diusulkan | Belmawa | 1.100.000 |
|  |  | Perguruan Tinggi | \- |
|  |  | Instansi Lain (Jika ada) | \- |
| 3 | Transportasi lokal (Adaptasi dari: Transportasi tim untuk pencarian referensi & kumpul ngerjakan proyek), maksimum 30% dari jumlah dana yang diusulkan | Belmawa | 150.000 |
|  |  | Perguruan Tinggi | 1.000.000 |
|  |  | Instansi Lain (Jika ada) | \- |
| 4 | Lain-lain (Adaptasi dari: Lisensi Figma/Software Tools & Subsidi Internet Usage Tim),  maksimum 15% dari jumlah dana yang diusulkan | Belmawa | 1.050.000 |
|  |  | Perguruan Tinggi | 450.000 |
|  |  | Instansi Lain (Jika ada) | \- |
| Jumlah |  |  | Rp8.550.000 |
| Rekap Sumber Dana |  | Belmawa | Rp7.100.000 |
|  |  | Perguruan Tinggi | Rp1.450.000 |
|  |  | Instansi Lain (Jika ada) | Rp0 |
|  |  | Jumlah | Rp8.550.000 |

Tabel 4.1 Rekapitulasi Rencana Anggaran Biaya

**4.2 	Jadwal Kegiatan**  
Tabel 4.2 Jadwal Kegiatan

| No | Jenis Kegiatan | Bulan |  |  |  | Penanggung Jawab |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
|  |  | 3 | 4 | 5 | 6 |  |
| 1 | **Inisiasi:** User Requirements & Planning |  |  |  |  | Albert (PM) |
| 2 | **Inisiasi:** Pembuatan ERD, UML & *Architecture*  |  |  |  |  | Gregorio (SA) |
| 3 | **UI/UX:** Desain *Wireframe*, Fitur Utama & *Leaderboard*  |  |  |  |  | Jovan (UI/UX) |
| 4 | **Backend (Inc 1, 2, 3):** Setup API, Logic, & Extra Features  |  |  |  |  | Albert (BE) |
| 5 | **Frontend (Inc 1, 2, 3):** *Slicing Auth*, Aplikasi Utama, & *Extra*  |  |  |  |  | Gregorio (FE) |
| 6 | **QA:** *Integration & QA* (Fase Inc 1\)  |  |  |  |  | Jovan (QA) |
| 7 | **QA:** *Integration & QA* (Fase Inc 2 & Inc 3\)  |  |  |  |  | Jovan (QA) |
| 8 | **Finalisasi:** *System Testing* (UAT)  |  |  |  |  | Jovan (QA) |
| 9 | **Finalisasi:** *Final Bug Fixing*  |  |  |  |  | Gregorio & Albert |
| 10 | **Finalisasi:** *Deployment & Manual Book*  |  |  |  |  | Albert (PM) |

**DAFTAR PUSTAKA**

**IEEE, 1998\.** *IEEE Recommended Practice for Software Requirements Specifications, IEEE Std 830-1998*.  
**NewLine Technologies, 2018\.** Incremental Model of Software Development Life Cycle. *Medium*.  
**Rawal, V., 2020\.** 1\. Introduction 1.1–1.4. *Medium*.

**Lampiran 1\. Biodata Ketua dan Anggota, serta Dosen Pendamping**  
Biodata Ketua	

1. Identitas Diri

| 1 | Nama Lengkap  |  |
| :---: | :---- | :---- |
| 2 | Jenis Kelamin | Laki-laki / Perempuan |
| 3 | Program Studi |  |
| 4 | NIM |  |
| 5 | Tempat dan Tanggal Lahir |  |
| 6 | Alamat Email |  |
| 7 | Nomor Telepon/HP |  |

2. Kegiatan Kemahasiswaan Yang Sedang/Pernah Diikuti

| No | Jenis Kegiatan | Status dalam Kegiatan | Waktu dan Tempat |
| :---: | :---: | :---: | :---: |
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |

3. Penghargaan Yang Pernah Diterima

| No. | Jenis Penghargaan | Pihak Pemberi Penghargaan | Tahun |
| :---: | :---: | :---: | :---: |
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |

Semua data yang saya isikan dan tercantum dalam biodata ini adalah benar dan dapat dipertanggungjawabkan secara hukum. Apabila di kemudian hari ternyata dijumpai ketidaksesuaian dengan kenyataan, saya sanggup menerima sanksi.

Demikian biodata ini saya buat dengan sebenarnya untuk memenuhi salah satu persyaratandalam pengajuan PKM-KC.

Kota, tanggal–bulan \-2026  
Ketua Tim

Tanda tangan (asli TT basah\*)

(Nama Lengkap)  
NIM:

Biodata Anggota 1

1. Identitas Diri

| 1 | Nama Lengkap  |  |
| :---: | :---- | :---- |
| 2 | Jenis Kelamin | Laki-laki / Perempuan |
| 3 | Program Studi |  |
| 4 | NIM |  |
| 5 | Tempat dan Tanggal Lahir |  |
| 6 | Alamat Email |  |
| 7 | Nomor Telepon/HP |  |

2. Kegiatan Kemahasiswaan Yang Sedang/Pernah Diikuti

| No | Jenis Kegiatan | Status dalam Kegiatan | Waktu dan Tempat |
| :---: | :---: | :---: | :---: |
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |

3. Penghargaan Yang Pernah Diterima

| No. | Jenis Penghargaan | Pihak Pemberi Penghargaan | Tahun |
| :---: | :---: | :---: | :---: |
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |

Semua data yang saya isikan dan tercantum dalam biodata ini adalah benar dan dapat dipertanggungjawabkan secara hukum. Apabila di kemudian hari ternyata dijumpai ketidaksesuaian dengan kenyataan, saya sanggup menerima sanksi.

Demikian biodata ini saya buat dengan sebenarnya untuk memenuhi salah satu persyaratandalam pengajuan PKM-KC.

Kota, tanggal–bulan-2026  
Anggota Tim 1

Tanda tangan (asli TT basah\*)

(Nama Lengkap)  
NIM:

Biodata Anggota 2

1. Identitas Diri

| 1 | Nama Lengkap  |  |
| :---: | :---- | :---- |
| 2 | Jenis Kelamin | Laki-laki / Perempuan |
| 3 | Program Studi |  |
| 4 | NIM |  |
| 5 | Tempat dan Tanggal Lahir |  |
| 6 | Alamat Email |  |
| 7 | Nomor Telepon/HP |  |

2. Kegiatan Kemahasiswaan Yang Sedang/Pernah Diikuti

| No | Jenis Kegiatan | Status dalam Kegiatan | Waktu dan Tempat |
| :---: | :---: | :---: | :---: |
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |

3. Penghargaan Yang Pernah Diterima

| No. | Jenis Penghargaan | Pihak Pemberi Penghargaan | Tahun |
| :---: | :---: | :---: | :---: |
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |

Semua data yang saya isikan dan tercantum dalam biodata ini adalah benar dan dapat dipertanggungjawabkan secara hukum. Apabila di kemudian hari ternyata dijumpai ketidaksesuaian dengan kenyataan, saya sanggup menerima sanksi.

Demikian biodata ini saya buat dengan sebenarnya untuk memenuhi salah satu persyaratandalam pengajuan PKM-KC.

Kota, tanggal–bulan-2026  
Anggota Tim 2

Tanda tangan (asli TT basah\*)

(Nama Lengkap)  
NIM:

Biodata Dosen Pendamping

1. Identitas Diri

| 1 | Nama Lengkap (dengan gelar) |  |
| :---: | :---- | :---- |
| 2 | Jenis Kelamin | Laki-laki / Perempuan |
| 3 | Program Studi |  |
| 4 | NIP/NUPTK |  |
| 5 | Tempat dan Tanggal Lahir |  |
| 6 | Alamat Email |  |
| 7 | Nomor Telepon/HP |  |

2. Riwayat Pendidikan

| No | Jenjang | Bidang Ilmu | Institusi | Tahun Lulus |
| ----- | ----- | :---: | :---: | :---: |
| 1 | Sarjana (S1) |  |  |  |
| 2 | Magister (S2) |  |  |  |
| 3 | Doktor (S3) |  |  |  |

3. Rekam Jejak Tri Dharma PT 

Pendidikan/Pengajaran

| No | Nama Mata Kuliah | Wajib/Pilihan | sks |
| :---: | ----- | :---: | ----- |
| 1\. |  |  |  |
| 2\. |  |  |  |

Penelitian

| No | Judul Penelitian | Penyandang Dana | Tahun |
| :---: | ----- | :---: | :---: |
| 1\. |  |  |  |
| 2\. |  |  |  |

KPengabdian Kepada Masyarakat

| No | Judul Pengabdian kepada Masyarakat | Penyandang Dana | Tahun |
| :---: | ----- | :---: | :---: |
| 1\. |  |  |  |
| 2\. |  |  |  |

Semua data yang saya isikan dan tercantum dalam biodata ini adalah benar dan dapat dipertanggungjawabkan secara hukum. Apabila di kemudian hari ternyata dijumpai ketidaksesuaian dengan kenyataan, saya sanggup menerima sanksi.  
Demikian biodata ini saya buat dengan sebenarnya untuk memenuhi salah satu persyaratandalam pengajuan PKM-KC**.**

Kota, tanggal–bulan-2026  
Dosen Pendamping  
TTD asli basah dan scan

(Nama Lengkap)  
NUPTK:  
**Lampiran 2\. Justifikasi Anggaran Kegiatan**

| No, | Jenis Pengeluaran | Volume |  Harga Satuan (Rp)  |  Nilai (Rp)  |
| ----- | :---- | ----- | ----- | ----- |
| 1 | Belanja Bahan (maks. 60%) |  |  |  |
|  | Kabel/engsel/mur/baut dan sejenisnya |  |  |  |
|  | Bahan kimia lab./bahan logam/kayu dan sejenisnya |  |  |  |
|  | Bibit tanaman/simplisia/pupuk |  |  |  |
|  | Alat ukir/alat lukis |  |  |  |
|  | Suku cadang/microcontroller/sensor/kit |  |  |  |
|  | Bahan lainnya sesuai program PKM-KC |  |  |  |
| SUBTOTAL |  |  | \- |  |
| 2 | Belanja Sewa (maks. 15%) |  |  |  |
|  | Sewa gedung/alat |  |  |  |
|  | Sewa server/hosting/domain/SSL/akses jurnal |  |  |  |
|  | Sewa lab. (termasuk penggunaan alat lab) |  |  |  |
|  | Sewa lainnya sesuai program PKM-KC |  |  |  |
| SUBTOTAL |  |  | \- |  |
| 3 | Perjalanan lokal (maks. 30 %) |  |  |  |
|  | Kegiatan penyiapan bahan |  |  |  |
|  | Kegiatan pendampingan |  |  |  |
|  | Kegiatan lainnya sesuai program PKM-KC |  |  |  |
| SUBTOTAL |  |  | \- |  |
| 4 | Lain-lain (maks. 15 %) |  |  |  |
|  | Jasa bengkel/uji coba |  |  |  |
|  | Percetakan produk |  |  |  |
|  | ATK lainnya |  |  |  |
|  | Paid *ads* akun media sosial  |  |  |  |
|  | Lainnya sesuai program PKM-KC |  |  |  |
| SUBTOTAL  |  |  | \- |  |
| GRAND TOTAL |  |  | \- |  |
| GRAND TOTAL (Terbilang ……) |  |  |  |  |

**Lampiran 3\. Susunan Tim Pengusul dan Pembagian Tugas**

| No | Nama/NIM | Program Studi | Bidang Ilmu | Alokasi Waktu (jam/ minggu) | Uraian Tugas |
| :---: | ----- | ----- | ----- | ----- | ----- |
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |

**Lampiran 4\. Surat Pernyataan Ketua Tim Pengusul**

SURAT PERNYATAAN KETUA TIM PENGUSUL

Yang bertanda tangan di bawah ini :

| Nama Ketua Tim | : |  |
| :---- | :---- | :---- |
| Nomor Induk Mahasiswa | :  |  |
| Program Studi | :  |  |
| Nama Dosen Pendamping | : |  |
| Perguruan Tinggi | :  |  |
| Judul Proposal PKM | : |  |

Dengan ini menyatakan bahwa proposal PKM-KC saya dengan judul yang diusulkan untuk tahun anggaran adalah:

1. Asli karya mahasiswa dan belum pernah dibiayai oleh lembaga atau sumber dana lain  
2. Penggunaan kecerdasan buatan/*Artificial Intelligence* (AI) mengikuti syarat dan ketentuan yang berlaku sesuai dengan Panduan GenAI Direktorat Pembelajaran dan Kemahasiswaan ([https://s.id/PanduanGenAI](https://s.id/PanduanGenAI)) 

Kami berkomitmen untuk menjalankan kegiatan PKM secara sungguh-sungguh hingga selesai. Bilamana di kemudian hari ditemukan ketidaksesuaian dengan pernyataan ini, maka saya bersedia dituntut dan diproses sesuai dengan ketentuan yang berlaku dan mengembalikan seluruh biaya yang sudah diterima ke kas negara.

Demikian pernyataan ini dibuat dengan sesungguhnya dan sebenar – benarnya.

Kota, Tanggal–Bulan- 2026  
Yang menyatakan,

Meterai senilai Rp. 10.000  
Tanda tangan (asli TT basah\*)

(Nama Lengkap)  
NIM.

**Lampiran 5\. Gambaran Teknologi yang akan Dikembangkan**  
Diisi dengan desain atau penjabaran lebih detail terkait teknologi yang dikembangkan, dapat berupa gambar atau uraian

**Lampiran 6\. Hasil Uji Periksa Similaritas Proposal**   
(Turtitin, iThenticate atau yang lainnya) dengan indeks similaritas maksimum 25% dengan indeks similaritas 25%, dan melampirkan hasil Uji Similaritas bagian inti artikel (**pendahuluan sampai dengan daftar pustaka**).  
