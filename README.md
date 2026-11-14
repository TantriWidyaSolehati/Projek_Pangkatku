# RuangEksponen

Website pembelajaran interaktif untuk materi bilangan berpangkat bulat positif dan negatif. Frontend React/Vite, API tutor FastAPI, dan Supabase Auth/PostgreSQL/Realtime dikonfigurasi terpisah.

## Game, kuis, contoh, dan musik

Setelah masuk, buka **Game Eksponen**, **Kuis Eksponen**, atau **Contoh soal** dari navigasi samping. Game menyediakan tantangan bertimer, pencocokan soal-hasil, misi berlevel, dan soal acak. Kuis berisi 12 soal acak beserta pembahasan; contoh soal dapat dibuka langkah demi langkah.

Musik belajar adalah melodi sintetis orisinal yang dibuat di browser, tidak memakai rekaman eksternal, dan hanya berjalan setelah tombol putar ditekan. Efek suara juga nonaktif secara default. Skor kuis hanya berlaku untuk sesi tersebut; progres misi disimpan lokal per akun pada perangkat yang digunakan. Keduanya tidak dikirim ke Supabase dan bukan nilai akademik resmi.

## Konfigurasi Supabase

1. Pastikan `frontend/.env.local` memiliki `VITE_SUPABASE_URL` berupa **Project URL** dasar (contoh `https://<project-ref>.supabase.co`) dan `VITE_SUPABASE_ANON_KEY` berupa publishable key atau anon key. Jangan tambahkan `/rest/v1` atau `/auth/v1`.
2. Kunci publishable/anon memang digunakan browser; jangan pernah menaruh `service_role` atau secret key di frontend.
3. Jika database belum disiapkan, jalankan `database/schema.sql` di Supabase SQL Editor. Jangan jalankan ulang sebagai cara memperbaiki masalah URL.
4. Di Supabase Dashboard > Authentication > URL Configuration, atur Site URL ke URL frontend HTTPS yang sedang aktif. Tambahkan redirect URL untuk URL Quick Tunnel frontend, misalnya `https://<nama-acak>.trycloudflare.com/**`. Untuk tunnel yang berubah-ubah, Supabase mendukung pola `https://*.trycloudflare.com/**`; batasi pola ini hanya untuk pengujian dan gunakan domain stabil untuk deployment.
5. Tetap aktifkan email confirmation. Pendaftaran mengarahkan tautan verifikasi ke `/login` pada origin halaman yang digunakan untuk mendaftar; reset password menggunakan `/reset-password`. URL redirect harus diizinkan pada konfigurasi Supabase. Bila email tidak tiba, periksa spam dan limit pengiriman email Supabase; jangan mengirim ulang berkali-kali.

Registrasi menggunakan metadata `username`, sedangkan otorisasi data tetap ditentukan oleh sesi Supabase dan kebijakan RLS. Admin diskusi ditentukan oleh klaim tepercaya `app_metadata.role`, bukan metadata yang dapat diedit pengguna.

## Memperbaiki tabel progres yang belum terdeteksi

`database/schema.sql` mendefinisikan `public.learning_progress`; aplikasi menggunakannya untuk progres materi. Jika tabel tidak ada pada proyek Supabase aktif atau PostgREST masih memakai schema cache lama, tinjau lalu jalankan `database/migrations/20261111_create_learning_progress.sql` secara manual di Supabase SQL Editor. Migrasi ini tidak dijalankan oleh aplikasi dan tidak menghapus baris tabel; bila tabel sudah ada, migrasi mempertahankan isinya, menerapkan ulang RLS khusus pemilik, dan meminta reload schema PostgREST.

Migrasi mengasumsikan tabel induk `public.profiles` dan `public.lessons` sudah tersedia seperti didefinisikan di `database/schema.sql`. Jika keduanya belum ada, siapkan schema dasar terlebih dahulu. Setelah migrasi berhasil, muat ulang aplikasi; jika PostgREST masih melaporkan cache lama, tunggu sebentar lalu jalankan `NOTIFY pgrst, 'reload schema';` di SQL Editor.

Jawaban latihan tersimpan terpisah sebagai baris riwayat pada `public.exercise_attempts`; progres materi disimpan satu baris per kombinasi pengguna dan pelajaran di `public.learning_progress` melalui upsert.

## Menjalankan lokal

Persyaratan: Node.js 20.19+ atau 22.12+ dan Python yang sesuai dengan dependensi backend.

Frontend:

```powershell
cd frontend
npm.cmd install
# Bila belum ada, salin .env.example menjadi .env.local lalu isi nilai Supabase.
npm.cmd run dev
```

Vite mendengarkan pada `0.0.0.0:5173`; buka `http://localhost:5173`. AI Tutor memakai `http://localhost:8000` sebagai fallback hanya saat halaman dibuka melalui localhost. Penggunaan dari hostname lain memerlukan `VITE_API_URL`.

Backend AI Tutor (terminal terpisah):

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
# Isi backend/.env: SUPABASE_URL, SUPABASE_ANON_KEY, AI_API_KEY.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`SUPABASE_URL` backend juga harus berupa Project URL dasar, `SUPABASE_ANON_KEY` adalah key publishable/anon, dan `AI_API_KEY` hanya untuk backend. `CORS_ORIGINS` adalah daftar origin frontend yang dipisahkan koma, tanpa wildcard; nilai lokal bawaan adalah `http://localhost:5173`. Periksa `http://localhost:8000/health`.

`POST /api/tutor` memvalidasi bearer access token ke Supabase Auth sebelum memanggil provider AI. Endpoint tutor memerlukan autentikasi; `/health` hanya mengembalikan status layanan. `AI_API_URL` memakai format Chat Completions yang kompatibel.

## Publikasi uji dengan Cloudflare Quick Tunnel

Quick Tunnel memberikan URL HTTPS acak dan sementara. Proses frontend, backend, dan kedua tunnel harus tetap hidup. Gunakan empat terminal PowerShell; **Terminal 2 dan 4 adalah dua terminal tunnel yang berjalan bersamaan**. Jalankan executable `cloudflared-windows-amd64.exe` yang tersedia di root proyek.

1. **Terminal 1 - backend**, jalankan Uvicorn seperti langkah lokal di atas. Pastikan `backend/.env` berisi konfigurasi Supabase dan `AI_API_KEY`.
2. **Terminal 2 - tunnel backend**, dari root proyek:

   ```powershell
   .\cloudflared-windows-amd64.exe tunnel --url http://localhost:8000
   ```

   Catat hostname HTTPS `https://...trycloudflare.com` yang tercetak. Tes `https://<hostname-backend>/health`.
3. Masukkan URL backend itu sebagai `VITE_API_URL` di `frontend/.env.local` (jangan menaruh slash di akhir). Jalankan frontend pada **Terminal 3**:

   ```powershell
   cd frontend
   npm.cmd run dev
   ```

4. **Terminal 4 - tunnel frontend**, dari root proyek:

   ```powershell
   .\cloudflared-windows-amd64.exe tunnel --url http://localhost:5173
   ```

   Catat URL HTTPS frontend yang tercetak.
5. Tambahkan URL frontend tersebut ke `CORS_ORIGINS` dalam `backend/.env`, berdampingan dengan origin lokal, contohnya:

   ```dotenv
   CORS_ORIGINS=http://localhost:5173,https://<hostname-frontend>.trycloudflare.com
   ```

   Restart Uvicorn agar perubahan CORS berlaku. Backend menolak konfigurasi wildcard; jangan gunakan `*` dengan credentials.
6. Di Supabase URL Configuration, pastikan Site URL dan Redirect URLs mengizinkan URL frontend tunnel. Jangan mengganti Project URL Supabase dengan URL Cloudflare.
7. Buka URL frontend HTTPS tersebut dari HP. Jika Quick Tunnel dimulai ulang dan URL berubah, perbarui `VITE_API_URL`, `CORS_ORIGINS`, dan URL redirect Supabase, lalu restart Vite/Uvicorn yang terkait. Jangan berasumsi URL tunnel tetap sama.

Vite hanya mengizinkan hostname `.trycloudflare.com` tambahan untuk tunnel Quick Tunnel, selain alamat lokal biasa. Browser dari halaman HTTPS juga menolak URL API HTTP, sehingga API publik harus memakai URL tunnel HTTPS.

## Pemeriksaan

- Buka URL publik dari komputer, lalu buka URL yang sama dari HP dengan Wi-Fi dimatikan dan data seluler aktif.
- Coba login dengan akun terverifikasi; daftar akun uji baru dan ikuti email verifikasi. Konfirmasi URL callback kembali ke hostname frontend yang aktif.
- Periksa dashboard Supabase untuk data profil, progres belajar, dan percobaan. Coba simpan progres/latihan dari satu perangkat lalu buka akun yang sama di perangkat lain.
- Buka materi, visualisasi, latihan, refleksi, diskusi, profil, dan AI Tutor. Untuk AI Tutor, backend perlu `AI_API_KEY`, URL backend HTTPS, dan origin frontend yang tercantum di `CORS_ORIGINS`.
- Jika gagal, lihat pesan halaman dan log terminal frontend/backend. Error CORS biasanya berarti origin publik frontend tidak cocok persis dengan `CORS_ORIGINS`.

Pengujian nyata login/email, database, AI provider, dan HP memerlukan akses proyek Supabase, email uji, `backend/.env`, serta jaringan/perangkat pengguna; keberhasilan build lokal saja tidak membuktikan layanan eksternal tersebut.

## Fitur

- Landing page, registrasi, login, reset password, dan halaman aplikasi terlindungi.
- Materi prasyarat dan materi utama, progres Supabase, serta dashboard siswa.
- Visualisasi pangkat positif/negatif dengan kontrol animasi dan kalkulator interaktif.
- Latihan pilihan ganda bertingkat/adaptif, petunjuk scaffolding, pembahasan, dan pencatatan percobaan.
- Refleksi, forum realtime dengan komentar/balasan, suka, dan laporan moderator.
- AI Tutor FastAPI dengan validasi sesi Supabase dan percakapan yang tersimpan di database.
- PWA manifest/service worker dengan cache hanya untuk aset statis same-origin; API dan data privat tidak dicache.

## Struktur

```text
frontend/       React, Vite, dan UI PWA
backend/        FastAPI AI Tutor
database/       Skema, seed konten latihan, RLS, dan Realtime
```

Tabel data siswa menggunakan Row Level Security. Jangan menaruh service-role key Supabase atau API key AI di frontend. Role admin diskusi memakai custom claim `app_metadata.role` yang hanya ditetapkan melalui layanan tepercaya.
