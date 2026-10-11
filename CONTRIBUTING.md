# Panduan Kontribusi (Contributing Guide)

Terima kasih atas ketertarikan Anda untuk berkontribusi pada **DSS Saham**! Kami menyambut baik kontribusi berupa perbaikan bug, penambahan fitur, peningkatan dokumentasi, maupun optimasi performa.

---

## 1. Alur Kontribusi (Workflow)

1. **Fork & Clone:**
   ```bash
   git clone https://github.com/username/dss-saham.git
   cd dss-saham
   ```
2. **Buat Feature Branch:**
   ```bash
   git checkout -b feat/nama-fitur-baru
   # atau untuk bugfix:
   git checkout -b fix/deskripsi-bug
   ```
3. **Kembangkan & Uji Perubahan:**
   Pastikan kode mematuhi standar linter dan seluruh automated tests lulus sebelum melakukan commit.
4. **Commit dengan Format Jelas:**
   Gunakan format **Conventional Commits**:
   - `feat(...)`: Fitur baru
   - `fix(...)`: Perbaikan bug
   - `refactor(...)`: Restrukturisasi kode tanpa mengubah fungsionalitas
   - `style(...)`: Penyesuaian formatting/linter
   - `docs(...)`: Perubahan dokumentasi
   - `test(...)`: Penambahan atau perbaikan unit/feature tests
5. **Push & Buat Pull Request:**
   Dorong branch Anda ke remote dan ajukan Pull Request (PR) dengan deskripsi ringkas tentang perubahan yang diajukan.

---

## 2. Standar Kualitas & Tooling

### Backend (PHP / Laravel)
- **Formatting:** Menggunakan [Laravel Pint](https://laravel.com/docs/pint).
  ```bash
  cd backend
  composer run format        # Memperbaiki formatting otomatis
  composer run lint          # Memeriksa kepatuhan PSR-12 / Pint
  ```
- **Automated Tests:** Menggunakan [PHPUnit](https://phpunit.de).
  ```bash
  cd backend
  composer run test          # Menjalankan seluruh test suite
  ```

### Frontend (React / Vite)
- **Linting:** Menggunakan [ESLint](https://eslint.org).
  ```bash
  cd frontend
  npm run lint               # Memeriksa aturan linting
  ```
- **Formatting:** Menggunakan [Prettier](https://prettier.io).
  ```bash
  cd frontend
  npm run format             # Memformat seluruh berkas
  npm run format:check       # Memeriksa kepatuhan formatting
  ```
- **Build Verification:**
  ```bash
  cd frontend
  npm run build              # Memastikan build produksi sukses
  ```

---

## 3. Kebijakan Keamanan & Secret
- **DILARANG KERAS** melakukan commit pada berkas `.env` asli, kredensial produksi, atau API key pribadi.
- Pastikan berkas `.env.example` selalu diperbarui jika Anda menambahkan variabel lingkungan baru.
