# Product Requirements Document (PRD)
## Sistem Pendukung Keputusan (DSS) Pemeringkatan Saham Berbasis SMART & SAW

**Status Dokumen:** Reverse-Engineered Draft (Hasil Analisis Kode Sumber)  
**Versi:** 1.0.0  
**Tanggal:** 11 Oktober 2026  
**Penulis Dokumen:** AI Reverse-Engineering Agent  
**Konteks Repositori:** `dss-saham` (Backend: Laravel 12, Frontend: React 19 + Vite)

---

## 1. Overview & Problem Statement

### 1.1 Ringkasan Produk
**DSS Saham** adalah aplikasi *Decision Support System* (Sistem Pendukung Keputusan / SPK) berbasis web yang dirancang untuk menganalisis, mengevaluasi, dan memeringkat kinerja keuangan emiten saham di Bursa Efek Indonesia (BEI / IDX) secara kuantitatif dan objektif.

Sistem mengintegrasikan dua metodologi SPK multi-kriteria klasik yang saling melengkapi:
1. **SMART (Simple Multi-Attribute Rating Technique):** Digunakan untuk normalisasi bobot preferensi kriteria fundamental.
2. **SAW (Simple Additive Weighting):** Digunakan untuk normalisasi matriks keputusan alternatif emiten (tipe *benefit* dan *cost*) serta kalkulasi nilai preferensi komprehensif ($V_i$) guna menentukan peringkat saham.

### 1.2 Problem Statement
- **Subjektivitas & Bias Kognitif:** Investor ritel dan analis pemula seringkali terjebak pada bias subjektif, rekomendasi rumor, atau hanya melihat satu metrik (misal PER saja atau dividen saja) saat memilih saham.
- **Keterbatasan Evaluasi Multi-Tahun:** Menilai konsistensi fundamental emiten blue-chip membutuhkan komparasi historis multi-tahun (hingga 15 tahun), yang jika dilakukan secara manual menggunakan spreadsheet memerlukan waktu lama dan rentan kesalahan rumus.
- **Ketiadaan Sistem Pembobotan Fleksibel:** Profil risiko setiap analis berbeda; sistem membutuhkan fleksibilitas simulasi sensitivitas bobot untuk melihat bagaimana perubahan prioritas kriteria memengaruhi peringkat emiten.

---

## 2. Target User & User Personas

| Persona | Deskripsi | Kebutuhan Utama | Hak Akses Sistem |
| :--- | :--- | :--- | :--- |
| **Investor Publik / Ritel** | Investor pasar modal yang mencari referensi saham dengan fundamental sehat berbasis data historis resmi. | Melihat dashboard ringkasan, tren performa historis Top 3 emiten, dan tabel peringkat emiten per tahun / all-time. | Publik (Tanpa Login) |
| **Financial Analyst** | Analis atau peneliti saham yang melakukan riset fundamental mendalam dan simulasi skenario investasi. | Menjalankan batch kalkulasi rasio, melakukan simulasi sensitivitas bobot (slider), dan meneliti radar performa. | Autentikasi (`role: user`) |
| **Administrator / Data Manager** | Pengelola sistem yang bertugas memelihara kelengkapan data fundamental, master kriteria, dan manajemen pengguna. | Input data keuangan manual/draft, kurasi status publikasi (`draft`/`direview`/`dipublikasi`), edit bobot global, CRUD user. | Autentikasi (`role: admin`) |

---

## 3. Fitur yang Sudah Ada & User Stories

### 3.1 Modul Publik (Tanpa Login)
- **US-PUB-01 (Landing Page):** Sebagai pengunjung, saya ingin melihat halaman pengenalan yang menjelaskan konsep metodologi SMART & SAW, cakupan emiten, ringkasan fitur, dan FAQ sistem.
- **US-PUB-02 (Dashboard Ringkasan):** Sebagai pengunjung, saya ingin melihat ringkasan statistik total emiten (39 emiten [ASUMSI]), skor rata-rata historis, pergerakan grafik tren emiten teratas (AreaChart), dan perbandingan rata-rata skor per sektor industri (BarChart).
- **US-PUB-03 (Peringkat Saham Multi-Periode):** Sebagai pengunjung, saya ingin memfilter hasil pemeringkatan saham berdasarkan tahun buku tertentu (2010–2025) atau All-Time (rata-rata historis), lengkap dengan nilai preferensi, progress bar, dan label status kesehatan emiten.

### 3.2 Modul Analis (Memerlukan Login: Role `user` atau `admin`)
- **US-ANA-01 (Autentikasi):** Sebagai pengguna terdaftar, saya ingin login menggunakan email dan password untuk mendapatkan token Sanctum serta mengakses area kerja analitis.
- **US-ANA-02 (Batch Calculation Rasio & Peringkat):** Sebagai analis, saya ingin menjalankan eksekusi batch langkah 1 (hitung rasio keuangan dari laporan keuangan yang berstatus `dipublikasi`) dan langkah 2 (hitung matriks normalisasi & perangkingan SAW) serta memantau progres melalui activity console log.
- **US-ANA-03 (Visualisasi Analitik Mendalam):** Sebagai analis, saya ingin meninjau diagram batang Top 10 preferensi SAW, diagram lingkaran distribusi status kesehatan emiten, dan radar perbandingan rata-rata rasio antara kelompok Top-5 vs Bottom-5 emiten.
- **US-ANA-04 (Simulasi Sensitivitas Real-Time):** Sebagai analis, saya ingin mengatur slider bobot untuk 5 kriteria secara interaktif dan melihat pergeseran posisi ranking saham secara *real-time* di peramban tanpa memengaruhi data di server database.

### 3.3 Modul Administrator (Memerlukan Login: Role `admin`)
- **US-ADM-01 (Entri Data Keuangan Manual):** Sebagai admin, saya ingin menginput data laporan keuangan satu per satu untuk neraca, laba rugi, arus kas, dan data pasar, dilengkapi fitur kalkulasi otomatis Ekuitas (`Total Aset - Total Liabilitas`).
- **US-ADM-02 (Manajemen Kriteria & Normalisasi SMART Global):** Sebagai admin, saya ingin mengubah bobot awal, nama kriteria, kode, atau atribut (*benefit*/*cost*), serta menjalankan fungsi normalisasi SMART global.
- **US-ADM-03 (Manajemen Perusahaan / Emiten):** Sebagai admin, saya ingin menambah emiten baru, memperbarui nama/sektor, atau menghapus emiten (dengan aturan cascade deletion pada tabel turunan).
- **US-ADM-04 (Manajemen Pengguna):** Sebagai super admin, saya ingin melihat daftar user, menambah user baru (role admin/user), mengedit profil/password, serta menghapus user (dengan proteksi tidak dapat menghapus akun sendiri).
- **US-ADM-05 (Kurasi Laporan Keuangan):** Sebagai admin, saya ingin memfilter, meninjau, mengedit nominal laporan keuangan, dan mengubah status siklus hidup data antara `draft`, `direview`, hingga `dipublikasi`.

---

## 4. Spesifikasi Algoritma SPK (SMART & SAW)

### 4.1 Kriteria Evaluasi Fundamental
Sistem mendefinisikan 5 kriteria standar (tabel `kriteria` & seeder `KriteriaSeeder`):

| Kode | Nama Kriteria | Tipe Atribut | Bobot Awal Default | Rumus Rasio Keuangan |
| :--- | :--- | :--- | :--- | :--- |
| **C1** | Return on Assets (ROA) | **Benefit** | 25.00 | $\frac{\text{Laba Bersih}}{\text{Total Aset}} \times 100\%$ |
| **C2** | Return on Equity (ROE) | **Benefit** | 25.00 | $\frac{\text{Laba Bersih}}{\text{Total Ekuitas}} \times 100\%$ |
| **C3** | Net Profit Margin (NPM) | **Benefit** | 20.00 | $\frac{\text{Laba Bersih}}{\text{Pendapatan}} \times 100\%$ |
| **C4** | Rasio Arus Kas Operasi | **Benefit** | 15.00 | $\frac{\text{Arus Kas Operasi}}{\text{Total Aset}}$ |
| **C5** | Debt to Equity Ratio (DER) | **Cost** | 15.00 | $\frac{\text{Total Liabilitas}}{\text{Total Ekuitas}}$ |

### 4.2 Tahap 1: Normalisasi Bobot Kriteria (Metode SMART)
Bobot awal tiap kriteria dinormalisasi agar jumlah total seluruh bobot bernilai 1.0:
$$W_j = \frac{w_j}{\sum_{k=1}^m w_k}$$
Di mana $w_j$ adalah bobot awal kriteria ke-$j$, dan $W_j$ adalah bobot ternormalisasi yang disimpan pada kolom `bobot_normalisasi`.

### 4.3 Tahap 2: Normalisasi Matriks Keputusan (Metode SAW)
Untuk setiap tahun buku, matriks alternatif dinormalisasi ($r_{ij}$) berdasarkan atribut kriteria:

1. **Untuk Kriteria Benefit (C1, C2, C3, C4):**
   $$r_{ij} = \begin{cases} \frac{x_{ij}}{\max_k(x_{kj})}, & \text{jika } \max(x) > 0 \\ 0, & \text{lainnya} \end{cases}$$
2. **Untuk Kriteria Cost (C5 - DER):**
   $$r_{ij} = \begin{cases} \frac{\min_k(x_{kj})}{x_{ij}}, & \text{jika } x_{ij} > 0 \\ 0, & \text{lainnya} \end{cases}$$

> **Catatan Implementasi Teknis (Sanitasi & Outlier Guard):**  
> Pada `AnalitikController::hitungPeringkat()`, sistem menerapkan batas atas (*cap*) dan batas bawah (*floor*) untuk mencegah pencilan ekstrem merusak normalisasi:  
> - Cap ROA: maks 40%  
> - Cap ROE: maks 60%  
> - Cap NPM: maks 60%  
> - Cap Arus Kas Operasi: maks 0.30  
> - Floor DER: minimum 0.05 (mencegah emiten dengan utang mendekati nol memicu lonjakan pembagian skor Cost tak terhingga).

### 4.4 Tahap 3: Kalkulasi Nilai Preferensi Akhir ($V_i$) & Perangkingan
Nilai preferensi tiap alternatif emiten $i$ pada tahun tertentu:
$$V_i = \sum_{j=1}^m W_j \cdot r_{ij}$$
Alternatif kemudian diurutkan secara menurun (*descending*) berdasarkan $V_i$.

### 4.5 Klasifikasi Status Kesehatan
Nilai preferensi diklasifikasikan ke dalam label interpretasi:
- **Sangat Sehat:** $V_i \ge 0.80$
- **Sehat:** $0.60 \le V_i < 0.80$
- **Kurang Sehat:** $V_i < 0.60$

---

## 5. System Architecture & Tech Stack

### 5.1 Diagram Arsitektur Komponen
```
[ Browser / Client ]
       │
       ▼
[ React 19 Frontend (Vite) ]
  ├── Public Views (LandingPage, Dashboard, Peringkat)
  ├── Analyst Views (Analitik, Sensitivity Slider)
  ├── Admin Panel (User, Emiten, Laporan, Kriteria)
  └── AuthContext + Axios Interceptor
       │
       ▼ HTTP REST API (Bearer Token)
[ Laravel 12 Backend ]
  ├── Routes: Public, auth:sanctum, is_admin middleware
  ├── Controllers (Analitik, Laporan, Master, Admin, Auth, Draft)
  ├── Services (SmartSawService, RatioService)
  └── Eloquent Models & DB Transactions
       │
       ▼
[ Database: MySQL / MariaDB / SQLite ]
  ├── users, perusahaan, laporan_keuangan
  ├── draft_laporan_keuangan, rasio_keuangan
  └── kriteria, peringkat
```

### 5.2 Rincian Tech Stack
- **Backend:**
  - Bahasa & Framework: PHP ^8.2, Laravel 12.0
  - Autentikasi: Laravel Sanctum 4.0
  - ORM: Laravel Eloquent dengan MySQL/MariaDB database driver (dukungan SQLite lokal)
  - Unit/Feature Testing: PHPUnit 11.5
- **Frontend:**
  - Core: React 19.2, Vite 8.0
  - Routing: React Router DOM 7.16
  - Styling: Tailwind CSS 4.3, Lucide React (ikon)
  - UI Primitives: Radix UI (`@radix-ui/react-dialog`, `dropdown-menu`, `tooltip`)
  - Charts & Data Viz: Recharts 3.8
  - Notifikasi: react-hot-toast 2.6
  - Package Tambahan Terpasang: `tesseract.js` 7.0, `react-image-crop` 11.0

---

## 6. Struktur Basis Data (Entity-Relationship Breakdown)

1. **`users`**
   - `id` (PK), `name`, `email` (unique), `password`, `role` (`admin` / `user`), `timestamps`
2. **`perusahaan`**
   - `id` (PK), `kode_saham` (varchar 10, unique), `nama_perusahaan`, `sektor` (nullable), `timestamps`
3. **`laporan_keuangan`**
   - `id` (PK), `perusahaan_id` (FK `perusahaan`, cascade delete), `tahun` (year)
   - `total_aset`, `total_liabilitas`, `total_ekuitas`
   - `jumlah_saham_beredar`, `harga_saham`, `pendapatan`, `laba_bersih`, `arus_kas_operasi`, `dividen`
   - `skala_nominal` (default 'Miliar'), `status_data` (`draft`, `direview`, `dipublikasi`)
   - Unique Index: `(perusahaan_id, tahun)`
4. **`draft_laporan_keuangan`**
   - Tabel perantara pengisian bertahap / OCR upload.
   - Kolom mirip `laporan_keuangan` (seluruh field nilai bernilai nullable).
   - `status_draft` (`incomplete`, `ready_for_review`, `verified`)
   - `image_aset_path`, `image_liabilitas_path`
5. **`rasio_keuangan`**
   - `id` (PK), `perusahaan_id` (FK), `tahun` (year)
   - `roa`, `roe`, `npm`, `rasio_arus_kas_operasi`, `rasio_utang` (decimal 12,4)
   - Unique Index: `(perusahaan_id, tahun)`
6. **`kriteria`**
   - `id` (PK), `kode` (varchar 5, unique; e.g. C1..C5), `nama_kriteria`, `atribut` (`benefit`/`cost`)
   - `bobot_awal` (decimal 8,2), `bobot_normalisasi` (decimal 8,6)
7. **`peringkat`**
   - `id` (PK), `perusahaan_id` (FK), `tahun` (year)
   - `nilai_preferensi` (decimal 10,6), `peringkat_ke` (integer), `status_kesehatan` (string)
   - Unique Index: `(perusahaan_id, tahun)`

---

## 7. Functional & Non-Functional Requirements

### 7.1 Functional Requirements
- **FR-01 (Kalkulasi Rasio Terfilter Status):** Backend HANYA boleh memproses data laporan keuangan yang berstatus `dipublikasi` saat mengeksekusi `hitungRasio()`. Data `draft` dan `direview` tidak boleh masuk kalkulasi publik.
- **FR-02 (Perlindungan Transaksi Atomik):** Seluruh proses perhitungan batch rasio dan peringkat wajib dibungkus dalam `DB::transaction()` untuk mencegah state data terpotong atau korup jika terjadi kegagalan kalkulasi di tengah proses.
- **FR-03 (Pemberian Hak Akses Berjenjang):**
  - Tamu (Unauthenticated): Hanya boleh membaca rute publik (`/`, `/dashboard`, `/peringkat`, dan API read-only).
  - Analyst (`role: user`): Boleh menjalankan analitik historis, simulasi sensitivitas, dan membaca data master.
  - Admin (`role: admin`): Memiliki akses mutlak ke admin panel, manajemen user, input/edit/delete laporan keuangan, dan mutasi kriteria.
- **FR-04 (Simulasi Sensitivitas di Client):** Fitur sensitivitas bobot pada frontend harus mampu mengkalkulasi ulang matriks SMART & SAW tanpa melakukan request jaringan ke backend, memungkinkan eksplorasi tanpa latensi.
- **FR-05 (Proteksi Akun Sendiri):** Sistem harus menolak permintaan penghapusan user jika ID target sama dengan ID pengguna yang sedang melakukan request (`destroyUser`).

### 7.2 Non-Functional Requirements
- **NFR-01 (Performa & Batching):** Endpoint kalkulasi batch harus mampu memproses 39 emiten selama 15 tahun buku (sekitar 585+ baris data) dalam waktu di bawah 3 detik dengan teknik query bulk insertion (`array_chunk(..., 500)`).
- **NFR-02 (Integritas Data):** Penerapan *foreign key cascading* pada level database memastikan penghapusan emiten secara otomatis membersihkan seluruh rekam jejak laporan keuangan, rasio, dan riwayat peringkat terkait.
- **NFR-03 (Responsivitas Antarmuka):** Antarmuka berbasis Tailwind CSS harus adaptif terhadap resolusi layar desktop maupun tablet, dengan sidebar navigasi yang jelas.

---

## 8. Fitur Setengah Jadi / Belum Selesai (WIP / Incomplete)

Berdasarkan penelusuran menyeluruh pada basis kode, ditemukan beberapa fitur yang sudah dirintis namun belum tersambung utuh atau belum selesai:

### 8.1 Ekstraksi OCR Gambar Laporan Keuangan (Setengah Jadi)
- **Kondisi Backend:** Controller `DraftLaporanController::ekstrakGambar()` hanya menyimpan berkas gambar ke disk (`draft/{kode}/{tahun}`) dan mengembalikan path, tanpa menjalankan proses ekstraksi OCR maupun integrasi LLM/Gemini (tercatat komentar eksplisit: `// (Ekstraksi OCR bisa ditambahkan di sini bila ada integrasi Gemini/OCR.)`).
- **Kondisi Frontend:** Ada file komponen `frontend/src/components/UploadLaporan.jsx` (355 baris) yang telah merancang UI 3-step wizard (Upload -> Ekstrak AI -> Koreksi & Simpan), dan repositori sudah memasang `tesseract.js` serta `react-image-crop`. Namun, komponen ini **tidak diimpor atau dirender di halaman manapun** (komponen yatim/orphan), serta URL endpoint di dalamnya keliru memanggil `/api/laporan/ekstrak-gambar` alih-alih `/api/draft/ekstrak-gambar`.

### 8.2 Bulk Import CSV pada Form Input Data (UI Placeholder)
- **Kondisi:** Di halaman `frontend/src/pages/InputData.jsx` terdapat kartu UI "Import CSV (Bulk import data historis)" dengan kotak drag-and-drop dan tombol "Browse File". Namun tombol dan kotak tersebut **tidak memiliki event listener/input file sama sekali** (hanya tampilan statis). Proses import CSV saat ini hanya dapat dijalankan melalui CLI seeder Laravel (`php artisan db:seed --class=ImportLaporanSeeder`).

### 8.3 Screener Saham Value Investing ala SabarKaya (Belum Masuk Routing)
- **Kondisi:** Backend telah menyediakan endpoint operasional `GET /api/analitik/screener` yang menghitung metrik valuasi (EPS, BVPS, PER, PBV, ROE, DER). Frontend juga sudah memiliki komponen antarmuka lengkap `frontend/src/components/ScreenerSaham.jsx` (153 baris) dengan pewarnaan khas *Value Investing*. Namun komponen ini **belum dimasukkan ke dalam rute `App.jsx` maupun menu navigasi `MainLayout.jsx`**, sehingga tidak dapat diakses oleh pengguna biasa melalui UI.

### 8.4 Redundansi Layout (`AppLayout.jsx` vs `MainLayout.jsx`)
- **Kondisi:** Terdapat dua file layout utama di frontend: `src/components/layout/AppLayout.jsx` (memiliki fitur collapsible sidebar, search bar, dropdown tahun buku, dan tombol "Export CSV") dan `src/components/MainLayout.jsx` (layout yang aktif digunakan saat ini). Fitur ekspor CSV di `AppLayout.jsx` belum diintegrasikan ke `MainLayout.jsx`.

### 8.5 Pemetaan Kriteria yang di-Hardcode (Hardcoded Criteria Mapping)
- **Kondisi:** Di `SmartSawService.php` dan `AnalitikController.php`, kriteria C1 sampai C5 dipetakan secara kaku ke kolom tabel (`roa`, `roe`, `npm`, `rasio_arus_kas_operasi`, `rasio_utang`). Jika admin menambahkan kriteria C6 di tabel `kriteria` melalui Admin Panel, sistem belum memiliki mekanisme dinamis untuk memetakan kolom database baru tersebut ke dalam matriks kalkulasi.

---

## 9. Batasan Teknis & Label Asumsi `[ASUMSI]`

Bagian-bagian berikut merupakan hipotesis atau tebakan hasil reverse-engineering dari kode sumber yang memerlukan konfirmasi dari pemilik proyek:

1. **`[ASUMSI]` Basis Data Produksi:** Meskipun repositori menyediakan file lokal `backend/database/database.sqlite`, berkas dump `dss_saham_db (1).sql` mengindikasikan bahwa sistem awalnya dirancang untuk berjalan di atas MySQL / MariaDB (XAMPP / phpMyAdmin).
2. **`[ASUMSI]` Lingkup Universe Saham:** Sistem difokuskan pada saham berkapitalisasi besar / Blue Chip di Bursa Efek Indonesia (IDX) dengan dataset awal sejumlah 39 emiten (sesuai file `data_saham_siap_pakai.csv` dan stat pada Landing Page).
3. **`[ASUMSI]` Skala Satuan Moneter:** Seluruh input nominal keuangan (Aset, Liabilitas, Ekuitas, Pendapatan, Laba) diasumsikan dalam satuan **Miliar Rupiah** (sebagaimana tercantum pada kolom `skala_nominal` default 'Miliar' dan placeholder antarmuka).
4. **`[ASUMSI]` Ambang Batas Status Kesehatan:** Kategori status kesehatan (`>= 0.8` Sangat Sehat, `>= 0.6` Sehat, `< 0.6` Kurang Sehat) merupakan ambang batas empiris yang ditetapkan oleh pembuat sistem untuk keperluan pemeringkatan akademik/analisis DSS, bukan ambang regulasi resmi dari OJK/IDX.
5. **`[ASUMSI]` Alasan Pembatasan (Clamping) Rasio:** Pembatasan nilai (misal ROA maks 40%, DER floor 0.05) diterapkan untuk meminimalisasi anomali pembagian matematika pada metode SAW saat terdapat emiten dengan ekuitas negatif atau utang mendekati nol.
6. **`[ASUMSI]` Status Komponen `UploadLaporan` & `ScreenerSaham`:** Kedua komponen ini diasumsikan merupakan fitur rintisan pada fase pengembangan sebelumnya yang sempat ditinggalkan sementara untuk memprioritaskan alur utama pemeringkatan SMART & SAW.

---

## 10. Rekomendasi Roadmap Pengembangan Selanjutnya

1. **Fase 1 (Penyelesaian Fitur Gantung):**
   - Mendaftarkan rute `/screener` di `App.jsx` dan menambahkan menu "Screener Saham" pada navigasi Analyst di `MainLayout.jsx`.
   - Mengaktifkan input file pada kartu "Import CSV" di `InputData.jsx` agar admin dapat mengunggah file CSV langsung dari UI tanpa bantuan CLI artisan.
2. **Fase 2 (Pematangan Modul OCR / Vision):**
   - Menghubungkan komponen `UploadLaporan.jsx` ke routing aplikasi (misal di `/input-data/upload-gambar`).
   - Menyambungkan endpoint `POST /api/draft/ekstrak-gambar` ke pipeline Tesseract.js di frontend atau Google Gemini Vision API di backend untuk parsing angka otomatis.
3. **Fase 3 (Arsitektur & Keamanan):**
   - Menghapus komponen legacy `AppLayout.jsx` setelah menyerap fitur "Export CSV".
   - Membuat skema kriteria dinamis jika di masa depan sistem ingin mendukung penambahan rasio valuasi baru di luar C1–C5.
