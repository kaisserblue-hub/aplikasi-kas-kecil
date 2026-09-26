# Aplikasi Kas Kecil

Frontend HTML/CSS/JavaScript untuk pencatatan kas kecil PT BMKP dan PT BMKU.

## Menjalankan demo

Buka `index.html` melalui GitHub Pages atau web server statis. Tanpa konfigurasi Supabase, aplikasi menggunakan `localStorage` pada browser.

Akun demo:

- Kasir: `kasir@bmkp.com` / `password123`
- Direktur: `direktur@bmkp.com` / `password123`
- Admin: `admin@bmkp.com` / `password123`

## Mengaktifkan database online

1. Buat project gratis di Supabase.
2. Jalankan `supabase-schema.sql` di SQL Editor.
3. Buat tiga user pada Authentication > Users dan buat baris `profiles` sesuai role.
4. Isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `config.js`.

Catatan: versi repository ini masih memiliki mode demo localStorage. Integrasi Supabase penuh perlu mengganti fungsi baca/tulis di `app.js` dengan Supabase Auth dan query tabel. Jangan memasukkan service-role key ke frontend.

## Publikasi gratis

Aktifkan GitHub Pages dari Settings > Pages, pilih branch `main` dan folder `/ (root)`. Data demo tersimpan per browser; untuk multi-pengguna online gunakan integrasi Supabase.
