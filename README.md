# GameGuessr - Panduan Setup Lokal 🎮

GameGuessr adalah platform game kuis interaktif berbasis web (React.js + Node.js/Express + MySQL) yang dirancang untuk menebak game berdasarkan konten gambar dan detail pengetahuan game yang diunggah. Tampilan aplikasi ini telah dirombak menggunakan desain **Premium Glassmorphism** modern dengan grid pustaka game yang interaktif.

Dokumen ini memuat panduan lengkap untuk menjalankan aplikasi ini secara lokal di komputer Anda dan rekan tim Anda.

---

## 🛠️ Persiapan Awal
Sebelum memulai, pastikan komputer Anda sudah terinstal:
1. **Node.js** (Rekomendasi versi 18 atau 20 LTS).
2. **MySQL Server** (Bisa menggunakan XAMPP, Laragon, atau MySQL Installer mandiri).

---

## 💾 1. Setup Database MySQL

Aplikasi backend membutuhkan database bernama `gameguessr`. Ada dua cara untuk menyiapkannya:

### ⚡ Langkah 0 — Pastikan MySQL Server Berjalan (WAJIB setiap kali buka project!)

> **Ini adalah penyebab paling umum error `ECONNREFUSED ::1:3306`.**
> Backend akan gagal konek jika MySQL Server tidak aktif.

#### 🔵 Cara A — Lewat MySQL Workbench (Paling Mudah):
1. Buka aplikasi **MySQL Workbench**.
2. Di menu atas, pilih **Server → Startup/Shutdown**.
3. Klik tombol **Start Server** jika statusnya `Stopped`.
4. Tunggu hingga status berubah menjadi `Running` (hijau).

#### 🔴 Cara B — Daftarkan sebagai Windows Service (Sekali, sebagai Admin):
Jalankan **PowerShell sebagai Administrator**, lalu ketik:
```powershell
# 1. Daftarkan MySQL sebagai Windows Service
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL84

# 2. Start service-nya
net start MySQL84
```
Setelah ini MySQL akan otomatis jalan setiap komputer dinyalakan.

Untuk start manual kapan saja:
```powershell
net start MySQL84
```
Untuk stop:
```powershell
net stop MySQL84
```

#### 🟡 Cara C — Jalankan mysqld.exe Langsung (Jika belum ada service):
Buka **PowerShell biasa** dan jalankan:
```powershell
Start-Process "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" -ArgumentList "--console" -NoNewWindow
```
> Biarkan terminal ini tetap terbuka selama kamu mengerjakan project. Jika terminal ditutup, MySQL mati.

---

### Cara A (Rekomendasi - Otomatis dengan Seeding):
1. Aktifkan MySQL Server Anda dulu (lihat Langkah 0 di atas).
2. Buka MySQL client Anda (phpMyAdmin, DBeaver, atau MySQL Workbench).
3. Buat database baru bernama `gameguessr` dengan menjalankan SQL berikut:
   ```sql
   CREATE DATABASE gameguessr;
   ```
4. Biarkan kosong, kita akan mengisinya secara otomatis menggunakan script *seeding* di bagian setup Backend.

### Cara B (Menggunakan Data Fisik):
Jika Anda ingin menggunakan data yang sudah ada sebelumnya dari folder `mysql_data`:
1. Salin (*copy*) folder `gameguessr` yang ada di dalam `mysql_data` (di luar repositori git ini).
2. Tempel (*paste*) folder tersebut ke dalam direktori data aktif MySQL Anda (biasanya di `C:\xampp\mysql\data\` jika menggunakan XAMPP).

---


## 🖥️ 2. Setup Backend Server
Backend bertugas memproses API, mengelola WebSocket kuis real-time, dan memproses file upload kuis.

1. Buka terminal/command prompt, lalu masuk ke folder `BackEnd`:
   ```bash
   cd BackEnd
   ```
2. Instal semua modul dependency:
   ```bash
   npm install
   ```
3. Buat file `.env` sebagai konfigurasi lingkungan Anda:
   * Salin file `.env.example` dan ubah namanya menjadi `.env`.
   * Buka file `.env` tersebut dan sesuaikan konfigurasinya dengan MySQL Anda (ganti password database jika ada).
   * *(Catatan: Pembuatan kuis kini berjalan secara mandiri dan offline menggunakan parser teks terstruktur bawaan yang aman dan tidak memerlukan API Key pihak ketiga).*

4. **Jalankan Seeding Database** (Untuk mengisi 3 akun uji coba & 10 kuis kustom bawaan):
   ```bash
   npm run seed
   ```
   *Seeder ini akan otomatis memasukkan **14 kuis game populer** beserta gambarnya (Minecraft, Elden Ring, Cyberpunk 2077, GTA V, Hollow Knight, Red Dead Redemption 2, Stardew Valley, Super Mario, The Witcher 3, Valorant, Mobile Legend, Genshin Impact, Resident Evil 4 dan Zelda BotW).*

5. Jalankan server Backend:
   ```bash
   npm run dev
   ```
   Server backend akan berjalan di **`http://localhost:5000`**.

---

## 📄 3. Format Unggah Kuis Manual (Format Teks Terstruktur)
Jika Anda ingin membuat kuis baru menggunakan file teks tanpa bergantung pada AI, uploader dapat menuliskan daftar pertanyaan di berkas `.txt` dengan format terstruktur seperti di bawah ini:

```text
Question: Siapa pencipta game Minecraft sebelum diakuisisi Microsoft?
A: Markus Persson (Notch)
B: Jens Bergensten (Jeb)
C: Gabe Newell
D: Steve Jobs
Answer: A

Question: Apa boss terakhir di Minecraft yang berada di dimensi kegelapan?
A: Wither
B: Ender Dragon
C: Warden
D: Herobrine
Answer: B
```
Sistem parser lokal di backend akan otomatis mendeteksi format di atas dan mengimpor semua pertanyaan ke editor secara instan dengan tingkat presisi 100%.

---

## 🎨 4. Setup Frontend (React)
Frontend adalah tampilan antarmuka pengguna web yang modern dan responsif.

1. Buka terminal baru, lalu masuk ke folder `FrontEnd`:
   ```bash
   cd FrontEnd
   ```
2. Instal semua modul dependency:
   ```bash
   npm install
   ```
3. Jalankan server Frontend:
   ```bash
   npm run dev
   ```
   Web akan berjalan lokal di **`http://localhost:5173`**. Buka alamat tersebut di browser Anda.

---

## 🔑 Akun Uji Coba (Test Accounts)
Jika Anda menggunakan database hasil *seeding* otomatis, Anda bisa login menggunakan akun bawaan berikut:

| Peran (Role) | Email | Password | Kegunaan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@gameguessr.com` | `Admin123` | Mengelola user, kuis, dan melihat laporan statistik |
| **Uploader** | `uploader@gameguessr.com` | `Upload123` | Membuat kuis baru (unggah dokumen teks terstruktur, JSON, atau gambar) |
| **Player (Participant)** | `player@gameguessr.com` | `Player123` | Bermain kuis, memfilter kategori game, dan masuk leaderboard |

---

## ⚠️ Perhatian Keamanan (Security Warning)
* **Jangan pernah menaruh password database atau data kredensial asli Anda di GitHub.** 
* File `.env` yang memuat password database lokal Anda sudah masuk ke dalam `.gitignore` sehingga aman tidak akan terunggah saat Anda melakukan push/commit.
* Teman tim Anda wajib membuat file `.env` mereka sendiri secara lokal dengan menyalin file `.env.example` seperti panduan di atas.
