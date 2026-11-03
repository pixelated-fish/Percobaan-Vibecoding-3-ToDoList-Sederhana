# My Tasks — To-Do List App

Aplikasi to-do list berbasis website yang sederhana, modern, dan responsif. Dibuat
menggunakan **HTML5, CSS3, dan JavaScript Vanilla (ES6+)** tanpa framework, tanpa
backend, dan tanpa proses build. Semua data tugas disimpan di **LocalStorage**
browser pengguna.

![Teknologi](https://img.shields.io/badge/HTML5-CSS3-6366F1) ![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-818CF8)

---

## Fitur

### Manajemen tugas
- **Tambah tugas** dengan judul (wajib), deskripsi, due date, prioritas, dan kategori.
- **Edit tugas** melalui modal yang sudah terisi data sebelumnya (Save Changes / Cancel).
- **Hapus tugas** dengan dialog konfirmasi (batal = data tidak berubah).
- **Tandai selesai / aktif kembali** lewat checkbox kustom.
- **Clear Completed** untuk menghapus sekaligus semua tugas yang sudah selesai.
- Validasi input: judul tidak boleh kosong, spasi berlebih dipangkas, panjang judul
  120 karakter, deskripsi 500 karakter, due date harus valid.

### Pencarian, filter, dan pengurutan
- Pencarian berdasarkan judul tugas (langsung saat mengetik).
- Filter status: **All Tasks**, **Active**, **Completed**.
- Filter kategori: **All Categories**, Personal, Work, Study, Other.
- Pengurutan: Newest First, Oldest First, Due Date (Nearest), Priority (High to Low).
- Semua kombinasi (pencarian + status + kategori + sorting) bisa dipakai bersamaan.

### Dashboard
- Tiga kartu statistik: **Total Tasks**, **Completed**, **Pending** — otomatis
  diperbarui setiap ada perubahan.
- **Progress bar** berisi persentase tugas yang sudah selesai.
- Tanggal hari ini ditampilkan otomatis di header.
- Indikator jumlah tugas yang belum selesai di header.

### Pengalaman pengguna
- **Toast notification** untuk tambah, edit, hapus, selesai, dan clear completed.
- **Empty state** ilustratif, dengan pesan berbeda saat tidak ada tugas sama sekali
  maupun saat filter/pencarian tidak menemukan hasil.
- **Dark mode** dengan preferensi tersimpan di LocalStorage (default mengikuti
  `prefers-color-scheme` sistem).
- **Responsif** dari desktop, laptop, tablet, sampai smartphone.
- **Aksesibilitas**: semantic HTML, label form, `aria-live` pada statistik dan daftar
  tugas, `role="progressbar"`, dialog dengan `aria-labelledby`, dan focus ring.
- Shortcut keyboard: tekan `/` untuk fokus ke kolom pencarian, `Esc` untuk menutup
  dialog atau membersihkan pencarian.

### Detail visual tugas
- Judul tugas selesai memakai `text-decoration: line-through` dan tampilan lebih redup.
- Badge prioritas: **High** merah, **Medium** kuning/oranye, **Low** hijau.
- Badge kategori dengan warna titik berbeda per kategori.
- Due date ditandai oranye untuk "Due today", merah untuk "Overdue".

---

## Teknologi

| Teknologi | Penggunaan |
| --- | --- |
| HTML5 | Struktur halaman semantic (`header`, `main`, `aside`, `section`, `dialog`, `template`) |
| CSS3 | CSS variables, Flexbox, CSS Grid, animasi, media queries, dark mode |
| JavaScript Vanilla (ES6+) | Seluruh logika aplikasi, modular per file, tanpa framework/TypeScript |
| LocalStorage | Penyimpanan data tugas dan preferensi tema |

Tidak ada dependency, tidak ada `npm install`, tidak ada build step.

---

## Struktur Folder

```
todo-list/
│
├── index.html                # Struktur utama aplikasi
├── README.md                 # Dokumentasi ini
│
├── assets/
│   └── icons/
│       └── favicon.svg       # Ikon aplikasi
│
├── css/
│   ├── variables.css         # Design token & tema (light + dark)
│   ├── style.css             # Reset, tipografi, utilitas dasar
│   ├── layout.css            # Layout utama, header, grid statistik
│   ├── components.css        # Komponen: tombol, form, badge, kartu tugas, modal, toast
│   └── responsive.css        # Media queries (tablet & smartphone)
│
└── js/
    ├── utils.js              # Helper: ID unik, format tanggal, normalisasi data
    ├── storage.js            # Baca/tulis LocalStorage (tasks + tema)
    ├── notifications.js      # Toast notification
    ├── tasks.js              # State tugas + operasi CRUD & validasi
    ├── filters.js            # Pencarian, filter status/kategori, sorting
    ├── ui.js                 # Rendering DOM, modal, feedback form, tema
    └── app.js                # Entry point: inisialisasi & event binding
```

### Tanggung jawab modul

| File | Tanggung jawab |
| --- | --- |
| `utils.js` | `generateId()`, `normalizeTask()`, format tanggal, konstanta prioritas/kategori |
| `storage.js` | `loadTasks()`, `saveTasks()`, `loadTheme()`, `saveTheme()`, deteksi LocalStorage tidak tersedia |
| `tasks.js` | Sumber data tunggal: `create`, `update`, `toggle`, `remove`, `clearCompleted`, `getStats`, `subscribe` |
| `filters.js` | `applyFilters(tasks, filters)` — fungsi murni untuk pencarian, filter, dan sorting |
| `ui.js` | Render statistik/progress/daftar tugas, kartu tugas dari `<template>`, modal edit & konfirmasi, tema |
| `app.js` | Menghubungkan event DOM ke modul, menyimpan state filter, memicu re-render |

---

## Cara Menjalankan Aplikasi

### Cara 1 — Langsung buka file (tanpa server)
1. Buka folder proyek.
2. Klik dua kali `index.html`, atau klik kanan → **Open with** → browser.
3. Aplikasi langsung berjalan.

Script dimuat sebagai classic script (bukan ES module) dengan urutan dependency yang
benar, sehingga aplikasi tetap bekerja pada protokol `file://` tanpa server lokal.

### Cara 2 — Server statis lokal (opsional)
Jika ingin memakai server (misalnya untuk live reload atau pengujian di perangkat lain):

```bash
# Python 3
python -m http.server 8000

# atau Node.js (jika tersedia)
npx serve .
```

Lalu buka `http://localhost:8000`.

---

## Sistem Penyimpanan Data

- Data disimpan di LocalStorage dengan dua key:
  - `mytasks.tasks.v1` — array tugas dalam bentuk JSON (`JSON.stringify`).
  - `mytasks.theme.v1` — preferensi tema (`light` atau `dark`).
- Saat aplikasi dimuat, `JSON.parse()` dipakai untuk membaca data kembali. Jika data
  belum ada, rusak, atau bukan array, aplikasi memakai daftar kosong tanpa error.
- Setiap record divalidasi ulang lewat `normalizeTask()`: field yang hilang/tidak valid
  diisi nilai default, record tanpa judul dibuang, dan ID duplikat diabaikan.
- Setiap operasi CRUD langsung menulis ulang array ke LocalStorage, sehingga data tetap
  ada setelah refresh, menutup tab, atau membuka kembali browser.
- Jika LocalStorage diblokir (misalnya private mode ketat), aplikasi tetap berjalan
  dalam memori dan menampilkan toast peringatan bahwa perubahan tidak tersimpan.

### Struktur objek tugas

```json
{
  "id": "5f6d0c58-3a4e-4f5c-9d0f-2b2a1c7e9b11",
  "title": "Belajar JavaScript",
  "description": "Mempelajari DOM Manipulation",
  "dueDate": "2026-11-05",
  "priority": "high",
  "category": "study",
  "completed": false,
  "createdAt": "2026-11-03T08:15:00.000Z",
  "updatedAt": "2026-11-03T08:15:00.000Z"
}
```

Keterangan: `id` dihasilkan dari `crypto.randomUUID()` (fallback ke timestamp + random),
`dueDate` berformat `YYYY-MM-DD` atau string kosong, `priority` = `low|medium|high`,
`category` = `personal|work|study|other`.

---

## Cara Menghapus Seluruh Data LocalStorage

Pilih salah satu cara berikut.

**Lewat DevTools browser (disarankan):**
1. Buka aplikasi di browser, tekan `F12` (atau `Ctrl+Shift+I`).
2. Masuk ke tab **Application** (Chrome/Edge) atau **Storage** (Firefox).
3. Buka **Local Storage** → pilih origin aplikasi.
4. Hapus key `mytasks.tasks.v1` dan/atau `mytasks.theme.v1`, lalu refresh halaman.

**Lewat Console browser:**

```js
localStorage.removeItem('mytasks.tasks.v1'); // hapus semua tugas
localStorage.removeItem('mytasks.theme.v1'); // hapus preferensi tema
localStorage.clear();                        // hapus seluruh data origin ini
```

**Lewat antarmuka aplikasi:**
- Hapus tugas satu per satu (tombol Delete), atau gunakan **Clear Completed** untuk
  menghapus semua tugas yang sudah selesai.

> Catatan: `localStorage.clear()` akan menghapus seluruh data origin tersebut, termasuk
> data aplikasi lain jika dijalankan pada server/origin yang sama.

---

## Catatan Implementasi

- **Keamanan (XSS):** semua teks dari pengguna (judul, deskripsi, nama tugas pada dialog)
  dimasukkan ke DOM menggunakan `textContent`, bukan `innerHTML`. `innerHTML` hanya
  dipakai untuk ikon SVG statis di modul notifikasi.
- **Modularitas:** tidak ada global variable liar; setiap modul membungkus dirinya dalam
  IIFE dan menempelkan API-nya ke namespace `window.MyTasks` (`storage`, `tasks`,
  `filters`, `ui`, `utils`, `notifications`).
- **Tidak ada inline CSS/JS** di HTML; semua perilaku ditangani dengan `addEventListener`
  (termasuk event delegation pada daftar tugas).
- **Filter, pencarian, dan sorting** dihitung dari satu fungsi murni sehingga kombinasinya
  konsisten dan tidak saling menimpa.
- **ID unik** memakai UUID, bukan indeks array.

---

## Ringkasan Pengujian Manual

| Skenario | Status |
| --- | --- |
| Tambah tugas (judul wajib, spasi dipangkas) | ✅ |
| Edit tugas via modal (Save Changes / Cancel) | ✅ |
| Hapus tugas dengan konfirmasi (batal tidak menghapus) | ✅ |
| Tandai selesai dan kembalikan ke aktif | ✅ |
| Pencarian judul + filter status + filter kategori + sorting bersamaan | ✅ |
| Clear Completed | ✅ |
| Statistik dan progress bar selalu sinkron | ✅ |
| Data tetap ada setelah refresh halaman | ✅ |
| Toast notification untuk setiap aksi | ✅ |
| Layout responsif di desktop, tablet, smartphone | ✅ |
| Tidak ada error di console browser | ✅ |
