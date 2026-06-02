# 📄 GameGuessr — Dokumentasi Implementasi
> Berdasarkan SRS v2.0 | Binus University - Group 4 | Prepared by Group 3 (Albert, Gregorio, Jovan)

---

## 🚀 Cara Menjalankan (Setiap Kali Buka Proyek)

Buka **2 terminal terpisah** dan jalankan:

### Terminal 1 — Backend API (Port 5000)
```bash
cd "d:\Project SE\Project-SE\BackEnd"
node src/index.js
```
> Server berjalan di: http://localhost:5000

### Terminal 2 — Frontend Dev Server (Port 5173)
```bash
cd "d:\Project SE\Project-SE\FrontEnd"
npm run dev
```
> Buka browser di: **http://localhost:5173**

> **Catatan Audio:** Musik akan mulai setelah klik pertama di halaman (browser restriction).

---

## 💾 Reset / Seed Database (Jalankan Sekali)

```bash
cd "d:\Project SE\Project-SE\BackEnd"
node src/config/seed.js
```

**Akun bawaan (setelah seed):**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gameguessr.com | Admin123 |
| Uploader | uploader@gameguessr.com | Upload123 |
| Player | player@gameguessr.com | Player123 |

---

## ✅ Status Implementasi (vs. SRS v2.0)

### FUN-01: User Account Management
| Requirement | Status | Catatan |
|-------------|--------|---------|
| Registrasi (username, email, password) | ✅ Implemented | REQ-AUTH-001 s/d 004 |
| Login dengan JWT (24h expiry) | ✅ Implemented | REQ-AUTH-006, 007 |
| Role: Participant, Uploader, Admin | ✅ Implemented | 3 role sesuai SRS |
| Middleware: requireAuth, requireUploader, requireAdmin | ✅ Implemented | REQ-AUTH-011 |
| Password hashing bcrypt (cost 10) | ✅ Implemented | REQ-AUTH-005 |
| Update profil (display name, avatar) | ✅ Implemented | GET/PATCH /auth/me |
| Audit log (login, register, role change) | ✅ Implemented | audit_log table |
| JWT refresh endpoint | ❌ Not implemented | REQ-AUTH-009 [Medium] |

### FUN-02: Uploader Module — Content Upload & Quiz Creation
| Requirement | Status | Catatan |
|-------------|--------|---------|
| Upload file .txt (parsed tanpa AI) | ✅ Implemented | parseStructuredText() |
| Upload file .pdf (extract teks) | ✅ Implemented | pdf-parse library |
| Upload file .docx (extract teks) | ✅ Implemented | mammoth library |
| Upload file .json (structured) | ✅ Implemented | JSON array format |
| Batas file 10 MB | ✅ Implemented | REQ-UPLOAD-002 |
| Step 1: Upload gambar + dokumen | ✅ Implemented | 4-step wizard |
| Step 2: Konfigurasi judul, deskripsi, tag, waktu | ✅ Implemented | Form config |
| Step 3: Edit pertanyaan (tambah/hapus/edit) | ✅ Implemented | Question editor |
| Step 4: Review & Publish | ✅ Implemented | Summary + publish |
| Bilingual quiz (ID + EN) | ✅ Implemented | Format `Question_EN:`, `A_EN:` dll |
| Validasi min. 1 pertanyaan saat publish | ✅ Implemented | REQ-UPLOAD-008 |
| Preview sebelum publish | ❌ Not implemented | REQ-UPLOAD-007 [Medium] |
| Edit quiz setelah dimainkan (block) | ❌ Not implemented | REQ-UPLOAD-009 [Medium] |

### FUN-03: Quiz Module — Real-Time Quiz Session
| Requirement | Status | Catatan |
|-------------|--------|---------|
| Daftar kuis tersedia (published) | ✅ Implemented | GET /api/quizzes |
| Ambil pertanyaan per kuis | ✅ Implemented | GET /api/quizzes/:id/questions |
| Timer countdown per pertanyaan | ✅ Implemented | Client-side + Socket.io sync |
| Submit jawaban + cek benar/salah | ✅ Implemented | handleSubmitAnswer() |
| Feedback overlay (benar/salah) | ✅ Implemented | 1.5 detik feedback |
| Skor bertambah (+1000 per jawaban benar) | ✅ Implemented | score += 1000 |
| Streak combo animation (≥3x beruntun) | ✅ Implemented | showStreakAnimation |
| Confetti setelah quiz selesai | ✅ Implemented | Canvas confetti |
| Sound effects (correct, incorrect, tick, click) | ✅ Implemented | WAV files di /audio/ |
| Cek sudah pernah main (block retake) | ✅ Implemented | BR-01: satu skor per kuis |
| Socket.io WebSocket (timer sync) | ✅ Implemented | socket.io 4.x |
| Reconnection handling | ⚠️ Partial | Client reconnects, tapi sesi tidak dilanjut |
| Random order pertanyaan per peserta | ❌ Not implemented | REQ-QUIZ-003 [High] |

### FUN-04: Leaderboard & History
| Requirement | Status | Catatan |
|-------------|--------|---------|
| Global leaderboard (top 50) | ✅ Implemented | GET /api/quizzes/leaderboard/global |
| Leaderboard per kuis | ✅ Implemented | GET /api/quizzes/:id/leaderboard |
| History kuis user (5 terakhir) | ✅ Implemented | GET /api/quizzes/history/me |
| Statistik: total, avg, highest score | ✅ Implemented | stats di history endpoint |
| Rank user setelah quiz selesai | ✅ Implemented | rank dihitung saat submit |
| Medal emoji 🥇🥈🥉 di leaderboard | ✅ Implemented | idx 0,1,2 |
| Filter leaderboard per kuis | ✅ Implemented | Dropdown di /leaderboard |
| Pagination leaderboard (>50 entries) | ❌ Not implemented | REQ-LEAD-003 [Medium] |
| Cache leaderboard 60 detik | ❌ Not implemented | REQ-LEAD-005 [Medium] |

### FUN-05: Admin Control Panel
| Requirement | Status | Catatan |
|-------------|--------|---------|
| Daftar semua user | ✅ Implemented | GET /api/admin/users |
| Promote/Demote role user | ✅ Implemented | PATCH /api/admin/users/:id |
| Soft-delete user (isActive = false) | ✅ Implemented | DELETE /api/admin/users/:id |
| Daftar semua kuis | ✅ Implemented | GET /api/admin/quizzes |
| Hide/Unhide kuis | ✅ Implemented | PATCH /api/admin/quizzes/:id |
| Delete kuis | ✅ Implemented | DELETE /api/admin/quizzes/:id |
| Statistik sistem (user, kuis, attempts, avg score) | ✅ Implemented | GET /api/admin/stats |
| Audit log setiap aksi admin | ✅ Implemented | audit_log table |
| Charts (Chart.js) di Reports Tab | ❌ Not implemented | REQ-ADMIN-007 [Low] |

---

## 🌐 Tech Stack (Aktual vs. SRS)

| Komponen | SRS Spesifikasi | Implementasi Aktual |
|----------|----------------|---------------------|
| Frontend | React 18.2.0 + MUI v5.14 | React 18 + Vanilla CSS (no MUI) |
| State Management | Context API + useReducer | Context API + useState |
| Backend | Node.js 20 + Express 4.18.2 | Node.js 22 + Express 4.x |
| Real-time | Socket.io 4.7.2 | Socket.io 4.x ✅ |
| Database | MySQL 8.0.35 | MySQL 8.4 ✅ |
| Auth | JWT HS256, bcrypt cost 10 | JWT HS256, bcrypt ✅ |
| File Upload | Multer 1.4.5 | Multer ✅ |
| PDF Parse | pdf-parse 1.1.1 | pdf-parse ✅ |
| DOCX Parse | mammoth 1.6.0 | mammoth ✅ |
| i18n | Bahasa Inggris only (SRS C-04) | **ID + EN bilingual** ✅ (lebih baik dari SRS) |
| UI Library | Material-UI | Custom glass-morphism design |

---

## 🎮 14 Kuis Bawaan (Seeded)

| # | Game | Bahasa | Gambar |
|---|------|--------|--------|
| 1 | Minecraft | ID + EN | ✅ |
| 2 | Cyberpunk 2077 | ID + EN | ✅ |
| 3 | Elden Ring | ID + EN | ✅ |
| 4 | Grand Theft Auto V | ID + EN | ✅ |
| 5 | Hollow Knight | ID + EN | ✅ |
| 6 | Red Dead Redemption 2 | ID + EN | ✅ |
| 7 | Stardew Valley | ID + EN | ✅ |
| 8 | Super Mario | ID + EN | ✅ |
| 9 | The Witcher 3 | ID + EN | ✅ |
| 10 | Zelda: Breath of the Wild | ID + EN | ✅ |
| 11 | Valorant 🆕 | ID + EN | ✅ |
| 12 | Mobile Legends 🆕 | ID + EN | ✅ |
| 13 | Genshin Impact 🆕 | ID + EN | ✅ |
| 14 | Resident Evil 4 🆕 | ID + EN | ✅ |

---

## 📋 Format File .txt untuk Upload Kuis

**100% tanpa AI** — server langsung parse format ini:

```
Question: [Pertanyaan dalam Bahasa Indonesia]
Question_EN: [Question in English]
A: [Pilihan A - Indonesia]
A_EN: [Option A - English]
B: [Pilihan B - Indonesia]
B_EN: [Option B - English]
C: [Pilihan C - Indonesia]
C_EN: [Option C - English]
D: [Pilihan D - Indonesia]
D_EN: [Option D - English]
Answer: [A/B/C/D]

[baris kosong antara pertanyaan]
```

**Ketentuan upload:**
- Minimal **3 pertanyaan** (disarankan 5+)
- Setiap pertanyaan wajib punya **4 pilihan (A, B, C, D)**
- Field `_EN` opsional — kalau tidak ada, otomatis pakai versi Indonesia
- File yang tersimpan sebagai contoh ada di `BackEnd/quizzes_txt/`

---

## 🔊 File Audio (di FrontEnd/public/audio/)

| File | Fungsi | Dipicu Saat |
|------|--------|-------------|
| bgm_elevator.mp3 | Background music | Load halaman (random) |
| bgm_fluffing.mp3 | Background music | Acak setiap track habis |
| bgm_monkeys.mp3 | Background music | |
| bgm_polka.mp3 | Background music | |
| bgm_trap.mp3 | Background music | |
| bgm_runamok.mp3 | Background music | |
| bgm_daisy.mp3 | Background music | |
| bgm_superepic.mp3 | Background music | |
| correct.wav | SFX jawaban benar | Submit jawaban benar |
| incorrect.wav | SFX jawaban salah | Submit salah / timeout |
| tick.wav | SFX countdown | Sisa waktu ≤5 detik |
| click.wav | SFX klik pilihan | Pilih opsi A/B/C/D |

---

## ❌ Fitur SRS yang Belum Diimplementasi (Backlog)

| ID | Fitur | Priority SRS | Effort |
|----|-------|-------------|--------|
| REQ-AUTH-009 | JWT refresh token endpoint | Medium | Kecil |
| REQ-QUIZ-003 | Random order pertanyaan per peserta | High | Kecil |
| REQ-UPLOAD-007 | Preview quiz sebelum publish | Medium | Sedang |
| REQ-UPLOAD-009 | Block edit quiz yg sudah dimainkan | Medium | Kecil |
| REQ-LEAD-003 | Pagination leaderboard | Medium | Kecil |
| REQ-LEAD-005 | Cache leaderboard 60 detik | Medium | Kecil |
| REQ-LEAD-006 | Badge "Top 3" di profil user | Low | Sedang |
| REQ-ADMIN-007 | Chart.js di Reports Tab | Low | Sedang |
| BR-04 | Auto-archive kuis tidak aktif 30 hari | Low | Kecil |
