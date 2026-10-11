# Laporan Audit Kode & Code Review Menyeluruh
## Sistem Pendukung Keputusan (DSS) Pemeringkatan Saham

**Dokumen:** `docs/AUDIT.md`  
**Referensi:** `docs/PRD.md`  
**Status:** Audit Temuan (Tanpa Perubahan Kode)  
**Tanggal:** 11 Oktober 2026  
**Auditor:** AI Code Reviewer

---

## Ringkasan Eksekutif Hasil Audit

Berdasarkan audit menyeluruh terhadap repositori `dss-saham` (Backend Laravel 12 & Frontend React 19), sistem telah memiliki fondasi algoritma SPK (SMART & SAW) dan antarmuka analitis yang baik. Namun, ditemukan sejumlah **kerentanan kritis** yang meliputi:
1. **Otorisasi Backend Terbuka:** Beberapa endpoint mutasi data keuangan dan emiten tidak diproteksi middleware `is_admin`, memungkinkan analis biasa memanipulasi data publik.
2. **Kredensial Default Terbuka:** Form login frontend meng-hardcode autofill akun super admin `admin@dssaham.com` / `password123`.
3. **Bug Logika Matematis SAW:** Nilai benefit (ROA/ROE/NPM) yang negatif menghasilkan nilai normalisasi negatif, yang mendistorsi pemeringkatan matematis SAW.
4. **Potensi Crash Fatal:** Potensi `DivisionByZeroError` di backend jika total bobot kriteria bernilai 0.
5. **Dead Code & Duplikasi:** Service `SmartSawService` dan `RatioService` tidak pernah dipanggil (algoritma diduplikasi inline di controller), serta ada 3 komponen frontend berukuran ratusan baris yang tidak tersambung ke routing.

Berikut adalah rincian temuan yang dikelompokkan sesuai kategori:

---

## 1. BUG (Logic Error, Crash, Edge Case, Missing Error Handling)

### BUG-01: Potensi Uncaught `DivisionByZeroError` saat Total Bobot Kriteria = 0
- **Lokasi:** `backend/app/Http/Controllers/AnalitikController.php` (Baris 168–171)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**  
  Pada method `hitungPeringkat()`, sistem melakukan normalisasi bobot SMART:
  ```php
  $kriteria   = Kriteria::all();
  $totalBobot = $kriteria->sum('bobot_awal');
  foreach ($kriteria as $k) {
      $k->bobot_normalisasi = $k->bobot_awal / $totalBobot;
      $k->save();
  }
  ```
  Jika tabel `kriteria` kosong atau seluruh bobot awal di-set 0 oleh admin, `$totalBobot` bernilai 0. PHP akan melempar fatal exception `DivisionByZeroError`, mengakibatkan HTTP 500 Internal Server Error tanpa penanganan error gracefull. Berbeda dengan `MasterController::normalizeKriteria` yang sudah memiliki pengecekan `$total <= 0`, di `AnalitikController` pengecekan ini terlewat.
- **Saran Perbaikan:**  
  Tambahkan guard clause sebelum perulangan:
  ```php
  if ($totalBobot <= 0) {
      return response()->json(['message' => 'Total bobot kriteria harus lebih dari 0 untuk menghitung peringkat.'], 422);
  }
  ```

---

### BUG-02: Normalisasi SAW Menghasilkan Nilai Negatif untuk Rasio Defisit (Kriteria Benefit)
- **Lokasi:** `backend/app/Http/Controllers/AnalitikController.php` (Baris 205–207)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**  
  Rasio ROA, ROE, dan NPM dihitung dari laba bersih emiten yang dapat bernilai negatif (pada `hitungRasio` diclamp masing-masing -20%, -30%, -50%). Pada tahap normalisasi SAW:
  ```php
  $n_roa = $maxMin['roa'] > 0 ? $roa_val / $maxMin['roa'] : 0;
  $n_roe = $maxMin['roe'] > 0 ? $roe_val / $maxMin['roe'] : 0;
  $n_npm = $maxMin['npm'] > 0 ? $npm_val / $maxMin['npm'] : 0;
  ```
  Jika suatu emiten mengalami rugi bersih (misal ROA = -15%), maka `$n_roa` bernilai negatif (misal $-15 / 10 = -1.5$). Hal ini melanggar asumsi dasar metode SAW di mana matriks ternormalisasi $r_{ij}$ harus berada dalam rentang $[0, 1]$. Nilai preferensi akhir $V_i$ menjadi minus dan mendistorsi skor.  
  Selain itu, jika dalam suatu tahun krisis (misal 2020) seluruh emiten mencatatkan ROA negatif ($\max < 0$), kondisi `$maxMin['roa'] > 0` bernilai false sehingga seluruh emiten mendapat skor 0 untuk ROA.
- **Saran Perbaikan:**  
  Terapkan penanganan nilai negatif agar konsisten dengan implementasi di `Sensitivity.jsx`, yaitu dengan floor 0:
  ```php
  $roa_val = max(0, min($row->roa, 40));
  $roe_val = max(0, min($row->roe, 60));
  $npm_val = max(0, min($row->npm, 60));
  ```
  Atau gunakan min-max scaling $(x - \min) / (\max - \min)$ jika ingin mempertahankan perbedaan relatif antar emiten yang sama-sama merugi.

---

### BUG-03: Peringkat Rata-Rata Historis Bias Terhadap Emiten yang Hanya Aktif 1 Tahun
- **Lokasi:** `backend/app/Http/Controllers/AnalitikController.php` (Baris 257–274)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**  
  Pada endpoint `getHasilPeringkat('all')`, nilai preferensi dihitung dengan `AVG(peringkat.nilai_preferensi)`.  
  Jika Emiten A baru IPO dan hanya memiliki data 1 tahun dengan performa luar biasa (skor 0.95), Emiten A akan menempati peringkat 1 mengalahkan Emiten B yang konsisten selama 15 tahun (rata-rata 0.91). Hal ini bertentangan dengan tujuan PRD yang ingin mengukur ketahanan jangka panjang 15 tahun.
- **Saran Perbaikan:**  
  Sertakan metrik jumlah tahun data yang tersedia (`COUNT(peringkat.tahun) as tahun_aktif`), tampilkan kolom periode aktif di tabel frontend, atau terapkan faktor penalti/threshold minimal tahun terdaftar (misal minimal 3 atau 5 tahun untuk masuk ranking all-time).

---

### BUG-04: Integritas Database Terputus (Duplicate Entry Crash) saat Admin Mengubah Tahun Laporan
- **Lokasi:** `backend/app/Http/Controllers/AdminController.php` (Baris 151–166)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**  
  Tabel `laporan_keuangan` memiliki constraint unik ganda:
  `$table->unique(['perusahaan_id', 'tahun']);`  
  Pada `AdminController::updateLaporan()`, validasi `tahun` tidak memvalidasi keunikan kombinasi `(perusahaan_id, tahun)` dengan record lain. Jika admin mengedit tahun suatu laporan ke tahun yang sudah pernah diinput untuk emiten yang sama, database melempar unhandled `PDOException: Integrity constraint violation (SQLSTATE 23000: 1062 Duplicate entry)` dan aplikasi crash 500.
- **Saran Perbaikan:**  
  Gunakan validation rule unique yang mengabaikan ID saat ini:
  ```php
  'tahun' => [
      'sometimes', 'required', 'integer', 'between:2000,2100',
      Rule::unique('laporan_keuangan')->where('perusahaan_id', $laporan->perusahaan_id)->ignore($id),
  ],
  ```

---

### BUG-05: Seeder Gagal Jika Dijalankan pada Basis Data SQLite
- **Lokasi:** `backend/database/seeders/ImportLaporanSeeder.php` (Baris 24 dan 87)
- **Tingkat Keparahan:** **LOW**
- **Penjelasan:**  
  Terdapat pemanggilan raw statement khusus MySQL:
  ```php
  DB::statement('SET FOREIGN_KEY_CHECKS=0;');
  ...
  DB::statement('SET FOREIGN_KEY_CHECKS=1;');
  ```
  Jika developer atau CI/CD menjalankan pengujian menggunakan SQLite (`backend/database/database.sqlite`), eksekusi seeder akan gagal dengan error sintaks SQL tidak dikenal.
- **Saran Perbaikan:**  
  Bungkus dengan pemeriksaan jenis driver database:
  ```php
  if (DB::getDriverName() === 'mysql') {
      DB::statement('SET FOREIGN_KEY_CHECKS=0;');
  }
  ```

---

## 2. LOOPHOLE KEAMANAN (Security & Access Control)

### SEC-01: Broken Access Control (Endpoint Mutasi Terbuka untuk Non-Admin) [SELESAI]
- **Status:** **SELESAI (Resolved)**
- **Lokasi:** `backend/routes/api.php` (Baris 44, 47, 50, 51, 52)
- **Tingkat Keparahan:** **CRITICAL**
- **Penjelasan:**  
  Route berikut berada di luar middleware `is_admin` (hanya dilindungi `auth:sanctum` biasa):
  - `POST /api/perusahaan` (Menambah emiten)
  - `POST /api/laporan/upload-neraca` (Menambah laporan keuangan mentah)
  - `POST /api/draft/ekstrak-gambar` (Upload gambar neraca)
  - `POST /api/draft/upload-neraca` (Menyimpan draft laporan)
  - `POST /api/draft/publish` (Menerbitkan draft menjadi status 'dipublikasi' publik)
  
  Meskipun di frontend antarmuka mendisabel tombol form untuk non-admin, pengguna dengan token `role: user` (analis biasa) dapat langsung mengirim HTTP POST request melalui Postman/cURL untuk membuat emiten baru, mengunggah data keuangan fiktif, bahkan langsung menerbitkannya ke data publik (`status_data = 'dipublikasi'`).
- **Saran Perbaikan:**  
  Pindahkan seluruh endpoint mutasi data tersebut ke dalam grup middleware `is_admin`:
  ```php
  Route::middleware(['auth:sanctum', 'is_admin'])->group(function () {
      Route::post('/perusahaan', [MasterController::class, 'storePerusahaan']);
      Route::post('/laporan/upload-neraca', [LaporanController::class, 'uploadNeraca']);
      Route::post('/draft/publish', [DraftLaporanController::class, 'publishFinal']);
      // ...
  });
  ```

---

### SEC-02: Kredensial Super Admin Ter-Hardcode & Terisi Otomatis di Halaman Login Publik
- **Lokasi:** `frontend/src/pages/login.jsx` (Baris 8–9) dan `backend/database/seeders/DatabaseSeeder.php` (Baris 20–23)
- **Tingkat Keparahan:** **CRITICAL**
- **Penjelasan:**  
  Di file `login.jsx`, state email dan password diinisialisasi secara hardcoded:
  ```javascript
  const [email, setEmail] = useState('admin@dssaham.com');
  const [password, setPassword] = useState('password123');
  ```
  Siapa pun yang mengakses URL `/login` di browser publik akan mendapati kredensial super admin sudah terisi otomatis di form dan dapat langsung menekan tombol "Masuk" untuk mengambil alih akun Super Admin. Password di seeder juga statis dan mudah ditebak.
- **Saran Perbaikan:**  
  1. Hapus nilai default di `login.jsx` menjadi `useState('')`.
  2. Di seeder, generate password acak atau ambil dari environment variable `ADMIN_INITIAL_PASSWORD`.

---

### SEC-03: Ketiadaan Rate Limiting (Throttle) pada Endpoint Login
- **Lokasi:** `backend/routes/api.php` (Baris 15)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**  
  Endpoint `Route::post('/login', [AuthController::class, 'login']);` tidak menggunakan middleware rate limiter. Penyerang dapat melakukan brute-force password guessing atau credential stuffing ribuan kali per detik tanpa ada pemblokiran IP atau cooldown.
- **Saran Perbaikan:**  
  Tambahkan rate limiter Laravel bawaan:
  ```php
  Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
  ```

---

### SEC-04: Personal Access Token Sanctum Berlaku Selamanya Tanpa Kedaluwarsa
- **Lokasi:** `backend/config/sanctum.php` (Baris 53)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**  
  Konfigurasi token expiry diset null:
  `'expiration' => null,`  
  Token yang diterbitkan tidak akan pernah kedaluwarsa. Jika token pengguna tersimpan di `localStorage` peramban publik atau dicuri melalui serangan XSS, token tersebut tetap aktif selamanya sampai pengguna melakukan logout manual.
- **Saran Perbaikan:**  
  Konfigurasikan masa kedaluwarsa token, misalnya 24 jam atau 7 hari:
  `'expiration' => 60 * 24,`

---

### SEC-05: Potensi Path Traversal pada Direktori Upload Gambar Draft
- **Lokasi:** `backend/app/Http/Controllers/DraftLaporanController.php` (Baris 21 dan 37)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**  
  Pada `DraftLaporanController::ekstrakGambar()`:
  ```php
  'kode_saham' => 'required|string|max:10',
  ...
  $path = $request->file('gambar')->store("draft/{$kode}/{$validated['tahun']}", 'public');
  ```
  Validasi `kode_saham` tidak membatasi karakter alfanumerik. Jika seseorang mengirim kode saham `../` atau karakter direktori traversal lainnya, berkas gambar dapat disimpan di luar direktori yang semestinya.
- **Saran Perbaikan:**  
  Tambahkan aturan `alpha_num` pada validasi kode saham:
  `'kode_saham' => 'required|string|alpha_num|max:10',`

---

### SEC-06: Kerentanan Dependensi Front-End Berisiko Tinggi (NPM Audit)
- **Lokasi:** `frontend/package.json` (Dependensi `axios` ^1.16.1, `react-router` ^7.16.0)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**  
  Hasil pemindaian `npm audit` menunjukkan 11 kerentanan (9 High, 2 Moderate):
  - `axios`: Rentan Prototype Pollution, HTTP Header Injection, SSRF bypass, dan Denial of Service.
  - `react-router`: Rentan Open Redirect via backslash dan Unauthenticated DoS.
- **Saran Perbaikan:**  
  Jalankan pembaruan dependensi:
  `cd frontend && npm update axios react-router-dom` atau `npm audit fix`.

---

### SEC-07: Client-Side Role Spoofing melalui LocalStorage
- **Lokasi:** `frontend/src/contexts/AuthContext.jsx` (Baris 11–16 dan 87)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**  
  Pengecekan hak akses admin di frontend mengandalkan:
  `isAdmin: user?.role === 'admin'`  
  State `user` diinisialisasi dari `localStorage.getItem('dss_user')`. Pengguna biasa dapat membuka Chrome Console, mengubah isi objek di localStorage menjadi `{"role": "admin"}`, lalu refresh halaman untuk memunculkan antarmuka Admin Panel dan menu Data Master. Meskipun backend menolak request API, data visual atau form rahasia di frontend dapat terlihat.
- **Saran Perbaikan:**  
  Setiap inisialisasi aplikasi, selalu panggil endpoint `/api/user` untuk memverifikasi role resmi dari server sebelum membuka rute terlindungi.

---

## 3. LOOPHOLE LOGIKA BISNIS (Business Logic Loopholes)

### LOG-01: Hilangnya Data Harga Saham & Dividen Saat Menerbitkan Draft ke Publik
- **Lokasi:** `backend/app/Http/Controllers/DraftLaporanController.php` (Baris 153–166)
- **Tingkat Keparahan:** **HIGH**
- **Penjelasan:**  
  Tabel `draft_laporan_keuangan` dan form draft tidak memiliki kolom `harga_saham` dan `dividen`. Saat admin/analis menjalankan `publishFinal()`, method tersebut memindahkan data draft ke tabel `laporan_keuangan`:
  ```php
  LaporanKeuangan::updateOrCreate(
      ['perusahaan_id' => $perusahaan->id, 'tahun' => $validated['tahun']],
      [
          'total_aset'       => $draft->total_aset,
          ...
          'status_data'      => 'dipublikasi',
      ]
  );
  ```
  Karena kolom `harga_saham` dan `dividen` tidak ada di draft, baris baru di `laporan_keuangan` akan memiliki `harga_saham = 0` (default database). Ketika pengunjung membuka Screener Saham (`getScreener`), metrik PER ($P / EPS$) dan PBV ($P / BVPS$) menjadi bernilai 0.00 (valuasi rusak).
- **Saran Perbaikan:**  
  Tambahkan kolom `harga_saham` dan `dividen` pada migrasi dan model `draft_laporan_keuangan`, serta masukkan ke dalam alur input draft.

---

### LOG-02: Status Publikasi Dipaksa Menjadi 'draft' Saat Admin Menambah Laporan Baru
- **Lokasi:** `backend/app/Http/Controllers/LaporanController.php` (Baris 68–75) dan `AdminPanel.jsx` (Baris 576–584)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**  
  Di `AdminPanel.jsx`, form tambah laporan menyediakan pilihan status (`draft`, `direview`, `dipublikasi`). Saat disubmit, frontend memanggil `POST /api/laporan/upload-neraca`. Namun di `LaporanController.php`:
  ```php
  if ($isNew) {
      $laporan->status_data = 'draft';
  }
  ```
  Status yang dipilih oleh admin diabaikan dan secara sepihak dipaksa menjadi `draft`. Admin yang memilih 'dipublikasi' akan heran mengapa datanya tidak muncul di halaman Analitik dan Publik sampai statusnya diedit ulang melalui tombol edit.
- **Saran Perbaikan:**  
  Izinkan input `status_data` diproses jika user yang login adalah admin:
  ```php
  if ($isNew) {
      $laporan->status_data = ($request->user()?->role === 'admin' && $request->filled('status_data')) 
          ? $request->status_data 
          : 'draft';
  }
  ```

---

### LOG-03: Bobot Ternormalisasi SMART Menjadi Basi (Stale) Saat Bobot Kriteria Diubah
- **Lokasi:** `backend/app/Http/Controllers/MasterController.php` (Baris 79–96)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**  
  Pada `MasterController::updateKriteria()`, admin dapat mengubah `bobot_awal`. Namun controller tersebut TIDAK otomatis memperbarui `bobot_normalisasi`. Kolom `bobot_normalisasi` di database tetap menyimpan nilai lama hasil pembagian bobot sebelumnya sampai seseorang secara manual menekan tombol "Normalisasi SMART". Jika ada proses kalkulasi lain yang membaca `bobot_normalisasi`, hasil perhitungannya salah.
- **Saran Perbaikan:**  
  Jalankan fungsi rekalkulasi otomatis di akhir `updateKriteria()`:
  ```php
  $this->normalizeKriteria();
  ```

---

### LOG-04: Multi-User Conflict & Ketiadaan User Ownership pada Tabel Draft
- **Lokasi:** `backend/app/Models/DraftLaporanKeuangan.php` & migration
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**  
  Tabel `draft_laporan_keuangan` tidak memiliki relasi `user_id`. Draft hanya diidentifikasi berdasarkan `(perusahaan_id, tahun)`. Jika Analis A sedang mengisi cicilan data draft untuk BBCA 2024, Analis B dapat secara tidak sengaja menimpa atau mempublikasikan draft tersebut sebelum Analis A selesai memeriksa.
- **Saran Perbaikan:**  
  Tambahkan kolom `created_by` / `user_id` pada draft agar setiap analis memiliki ruang kerja draft masing-masing sebelum direview oleh admin.

---

### LOG-05: Input Nilai Finansial Ekstrem / Negatif Tanpa Validasi Domain
- **Lokasi:** `backend/app/Http/Controllers/LaporanController.php` (Baris 26–38)
- **Tingkat Keparahan:** **LOW**
- **Penjelasan:**  
  Field `total_aset`, `total_liabilitas`, `jumlah_saham_beredar`, dan `harga_saham` hanya divalidasi `numeric`. Pengguna dapat memasukkan total aset negatif, atau jumlah saham beredar = 0. Hal ini memicu pembagian dengan nol pada perhitungan per-share metrics (EPS/BVPS) dan menghasilkan data tidak valid.
- **Saran Perbaikan:**  
  Tambahkan aturan validasi domain pasar modal:
  `'total_aset' => 'required|numeric|gt:0'`, `'jumlah_saham_beredar' => 'nullable|numeric|gt:0'`.

---

## 4. CODE SMELL (Duplikasi, Dead Code, Antipatterns)

### SML-01: Dead Code Ekstrem: `SmartSawService` dan `RatioService` Tidak Pernah Digunakan
- **Lokasi:** `backend/app/Services/SmartSawService.php` (112 baris) dan `RatioService.php` (61 baris)
- **Tingkat Keparahan:** **HIGH (Architectural Debt)**
- **Penjelasan:**  
  Repositori memiliki service class khusus `SmartSawService` dan `RatioService`. Namun, kedua file ini **TIDAK PERNAH DIINJEKSI ATAU DIPANGGIL** di controller mana pun. Seluruh kalkulasi rasio dan pemeringkatan SAW ditulis ulang secara inline di dalam `AnalitikController.php` (364 baris).  
  Lebih parah lagi, logika di `SmartSawService` berbeda (divergent) dari `AnalitikController` (misal: di service tidak ada clamping outlier dan tidak ada DER floor). Ini menciptakan kebingungan pengembang dan risiko regresi besar.
- **Saran Perbaikan:**  
  Pindahkan seluruh logika perhitungan dari `AnalitikController` ke dalam kedua service tersebut, jadikan controller hanya sebagai traffic coordinator (Single Responsibility Principle), lalu hapus duplikasi kode.

---

### SML-02: Dead Code Frontend: Komponen Yatim Tanpa Routing (700+ Baris)
- **Lokasi:**
  1. `frontend/src/components/UploadLaporan.jsx` (355 baris)
  2. `frontend/src/components/ScreenerSaham.jsx` (153 baris)
  3. `frontend/src/components/layout/AppLayout.jsx` (198 baris)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**  
  Ketiga komponen di atas tidak pernah diimpor atau dirender di `App.jsx` maupun file halaman lainnya.  
  - `ScreenerSaham.jsx` adalah fitur yang sudah selesai dan memiliki styling matang untuk value investing, namun "terkunci" karena lupa dimasukkan ke routing.
  - `UploadLaporan.jsx` adalah wizard 3 langkah lengkap dengan OCR, namun menembak endpoint API yang salah (`/api/laporan/ekstrak-gambar` padahal di backend `/api/draft/ekstrak-gambar`).
  - `AppLayout.jsx` adalah layout duplikat lama dengan fitur "Export CSV" yang belum dipindahkan ke `MainLayout.jsx`.
- **Saran Perbaikan:**  
  1. Daftarkan `/screener` di `App.jsx` dan tambahkan ke sidebar `MainLayout.jsx`.
  2. Hubungkan `UploadLaporan.jsx` ke rute `/input-data/upload-gambar` dan sesuaikan URL endpoint backend.
  3. Hapus `AppLayout.jsx` setelah menyerap fitur ekspor CSV.

---

### SML-03: Duplikasi Masif: `DataMaster.jsx` vs `AdminPanel.jsx`
- **Lokasi:** `frontend/src/pages/DataMaster.jsx` vs `frontend/src/pages/AdminPanel.jsx`
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**  
  Kedua file ini masing-masing mengimplementasikan `TabPerusahaan` dan `TabKriteria` secara mandiri dengan kode yang 80% identik (tabel perusahaan, form tambah, tabel kriteria, tombol normalisasi). Jika ada perubahan styling atau validasi kriteria, developer harus memperbarui kedua file tersebut secara terpisah.
- **Saran Perbaikan:**  
  Ekstrak tabel dan form master emiten serta kriteria menjadi komponen modular di `frontend/src/components/master/` atau jadikan `DataMaster.jsx` sebagai view sederhana yang mengimpor komponen dari `AdminPanel.jsx`.

---

### SML-04: Hardcoded Kriteria Coupling (Ketidakmampuan Menambah Kriteria Dinamis)
- **Lokasi:** `backend/app/Http/Controllers/AnalitikController.php` (Baris 51–60, 214–219)
- **Tingkat Keparahan:** **MEDIUM**
- **Penjelasan:**  
  Di `AnalitikController`, kode kriteria dipetakan secara kaku ke kolom database:
  `$kodeToColumn = ['C1' => 'roa', 'C2' => 'roe', 'C3' => 'npm', 'C4' => 'rasio_arus_kas_operasi', 'C5' => 'rasio_utang'];`
  Jika admin menambahkan kriteria C6 (misal PBV atau Dividen Yield) melalui fitur tambah kriteria di Admin Panel, algoritma SAW akan mengabaikan kriteria tersebut karena tidak terdaftar dalam hardcoded map.
- **Saran Perbaikan:**  
  Gunakan mekanisme pemetaan dinamis (misal tabel kriteria memiliki kolom `target_column` yang merujuk ke kolom rasio keuangan terkait).

---

### SML-05: Unbounded Query (Ketiadaan Pagination) di Seluruh Admin Endpoint
- **Lokasi:** `AdminController.php` (Baris 32, 140), `MasterController.php` (Baris 17)
- **Tingkat Keparahan:** **LOW**
- **Penjelasan:**  
  Query `User::all()`, `Perusahaan::all()`, dan `LaporanKeuangan::all()` menggunakan `->get()` tanpa batasan limit atau paginasi. Seiring berjalannya waktu saat data laporan keuangan mencapai ribuan baris, response payload akan membengkak dan memperlambat browser serta server.
- **Saran Perbaikan:**  
  Terapkan `->paginate(25)` di backend dan kontrol navigasi halaman di tabel frontend.

---

### SML-06: Tombol UI Placeholder Tanpa Logika (Dead Interactive Element)
- **Lokasi:** `frontend/src/pages/InputData.jsx` (Baris 316–322)
- **Tingkat Keparahan:** **LOW**
- **Penjelasan:**  
  Kartu "Import CSV" menampilkan area drag-and-drop dan tombol "Browse File", namun tombol tersebut adalah `<button type="button">` tanpa event handler `onClick` dan tanpa elemen `<input type="file" />`. Pengguna yang mengklik tombol tidak akan mendapatkan respons apa pun.
- **Saran Perbaikan:**  
  Pasang handler input file atau sembunyikan tombol dan beri label badge `[Segera Hadir / In Development]`.

---

## 5. Matriks Rekapitulasi Temuan & Prioritas Perbaikan

| ID Temuan | Kategori | Deskripsi Singkat | Tingkat Keparahan | Prioritas Aksi |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Keamanan | Broken Access Control pada endpoint mutasi data keuangan & draft | **CRITICAL** | **SELESAI** |
| **SEC-02** | Keamanan | Kredensial super admin hardcoded autofill di form login | **CRITICAL** | Prioritas 1 (Wajib) |
| **BUG-01** | Bug | Uncaught `DivisionByZeroError` saat total bobot kriteria = 0 | **HIGH** | Prioritas 2 |
| **BUG-02** | Bug | Normalisasi benefit SAW menghasilkan nilai negatif untuk laba minus | **HIGH** | Prioritas 2 |
| **SEC-03** | Keamanan | Ketiadaan rate limiting (throttle) pada endpoint `/login` | **HIGH** | Prioritas 2 |
| **SEC-04** | Keamanan | Personal access token Sanctum tidak pernah kedaluwarsa | **HIGH** | Prioritas 2 |
| **SEC-06** | Keamanan | Dependensi front-end rentan High severity (Axios & React Router) | **HIGH** | Prioritas 2 |
| **LOG-01** | Bisnis | Harga saham & dividen hilang (menjadi 0) saat draft dipublikasi | **HIGH** | Prioritas 2 |
| **SML-01** | Code Smell | Dead code: Service `SmartSawService` & `RatioService` tidak terpakai | **HIGH** | Prioritas 2 |
| **BUG-03** | Bug | Bias perangkingan historis untuk emiten yang baru aktif 1 tahun | **MEDIUM** | Prioritas 3 |
| **BUG-04** | Bug | Crash duplicate entry saat update tahun laporan keuangan | **MEDIUM** | Prioritas 3 |
| **SEC-05** | Keamanan | Potensi path traversal pada upload gambar draft | **MEDIUM** | Prioritas 3 |
| **SEC-07** | Keamanan | Role spoofing via manipulasi localStorage di browser | **MEDIUM** | Prioritas 3 |
| **LOG-02** | Bisnis | Status laporan keuangan baru selalu dipaksa menjadi 'draft' | **MEDIUM** | Prioritas 3 |
| **LOG-03** | Bisnis | Bobot normalisasi kriteria basi (stale) saat bobot awal diedit | **MEDIUM** | Prioritas 3 |
| **LOG-04** | Bisnis | Ketiadaan kepemilikan user pada tabel draft (multi-user collision) | **MEDIUM** | Prioritas 3 |
| **SML-02** | Code Smell | 3 komponen frontend yatim (`ScreenerSaham`, `UploadLaporan`, `AppLayout`) | **MEDIUM** | Prioritas 3 |
| **SML-03** | Code Smell | Duplikasi ganda halaman `DataMaster.jsx` dan `AdminPanel.jsx` | **MEDIUM** | Prioritas 3 |
| **SML-04** | Code Smell | Hardcoded kriteria mapping C1–C5 mencegah kriteria dinamis | **MEDIUM** | Prioritas 3 |
| **BUG-05** | Bug | Statement raw MySQL foreign key checks gagal di SQLite | **LOW** | Prioritas 4 |
| **LOG-05** | Bisnis | Ketiadaan validasi nilai nominal negatif/nol pada data pasar | **LOW** | Prioritas 4 |
| **SML-05** | Code Smell | Ketiadaan paginasi (unbounded queries) pada daftar laporan & user | **LOW** | Prioritas 4 |
| **SML-06** | Code Smell | Tombol "Browse File" CSV di InputData tanpa event handler | **LOW** | Prioritas 4 |

---

## 6. Langkah Penanganan yang Disarankan

1. **Sprint 1 (Keamanan & Hotfix Kritis):**
   - Amankan rute API dengan membungkus endpoint mutasi ke dalam `is_admin`.
   - Bersihkan autofill kredensial admin dari `login.jsx`.
   - Pasang rate limiter `throttle:5,1` pada route `/login`.
   - Tambahkan pengecekan `$totalBobot <= 0` pada `hitungPeringkat` untuk mencegah crash 500.
   - Perbaiki penanganan laba negatif pada rumus benefit SAW di `AnalitikController`.
2. **Sprint 2 (Integritas Logika Bisnis & Perbaikan Draft):**
   - Perbaiki alur `publishFinal` dan tabel draft agar tidak menghapus nilai `harga_saham` dan `dividen`.
   - Sinkronkan otomatis `bobot_normalisasi` setiap kali `bobot_awal` kriteria diperbarui di `updateKriteria`.
   - Pasang validasi keunikan kombinasi `(perusahaan_id, tahun)` pada method `updateLaporan`.
   - Izinkan admin menyimpan laporan baru dengan status 'dipublikasi' langsung dari form.
3. **Sprint 3 (Refactoring & Pembersihan Arsitektur):**
   - Refactor `AnalitikController` untuk menggunakan `SmartSawService` dan `RatioService`.
   - Sambungkan komponen `ScreenerSaham.jsx` ke routing aplikasi `/screener`.
   - Selesaikan atau bersihkan komponen `UploadLaporan.jsx` dan hapus layout usang `AppLayout.jsx`.
   - Satukan modul `DataMaster.jsx` ke dalam `AdminPanel.jsx` untuk mengeliminasi duplikasi kode.
