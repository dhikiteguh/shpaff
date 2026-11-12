SHOPEE AFFILIATE HTML GENERATOR — VERCEL READY

STRUKTUR FOLDER
- index.html              Antarmuka generator
- api/shopee-image.js     API serverless untuk mencoba mengambil URL foto dari halaman Shopee
- vercel.json             Konfigurasi Vercel
- package.json            Metadata proyek
- examples/               Contoh file JSON dan CSV

DEPLOY KE VERCEL
1. Ekstrak ZIP ini.
2. Upload seluruh isi folder ke repository GitHub (jangan hanya index.html).
3. Buka Vercel > Add New > Project.
4. Import repository GitHub tadi.
5. Framework Preset: Other.
6. Root Directory: ./ (folder utama yang berisi index.html, api/, dan vercel.json).
7. Build Command: kosongkan / None.
8. Output Directory: kosongkan / default.
9. Klik Deploy.

PENTING: API AMBIL FOTO
Tombol "Ambil dari Shopee" hanya bekerja setelah project di-deploy ke Vercel, karena memakai /api/shopee-image.
Membuka index.html langsung dari komputer tidak menjalankan fungsi API.
Untuk uji lokal dengan API, install Vercel CLI lalu jalankan `vercel dev` dari folder proyek.

FORMAT DATA
JSON dan CSV didukung. Nama kolom ekspor Shopee seperti "Nama Produk", "Harga", "Link Komisi Ekstra", dan "Link Produk" dikenali.
Link Komisi Ekstra diprioritaskan sebagai link affiliate, lalu Link Produk sebagai cadangan.
URL gambar dapat berasal dari kolom gambar, tombol "Ambil dari Shopee", URL manual, atau upload foto lokal.

BATASAN PENGAMBILAN GAMBAR
API mencoba membaca og:image, Twitter image, JSON-LD, dan URL CDN susercontent dari HTML produk Shopee. Shopee dapat membatasi permintaan otomatis, mengubah HTML, atau tidak mengembalikan metadata gambar. Jika gagal, masukkan URL foto hasil Inspect Element secara manual atau unggah file gambar.
Jangan gunakan API ini untuk mengambil gambar secara massal berlebihan. Hormati ketentuan dan pembatasan akses Shopee.

Tidak diperlukan database. Pemrosesan file JSON/CSV dilakukan di browser.
