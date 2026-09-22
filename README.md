# OSS v2 Virtual Filing Cabinet PoC

Proof of Concept untuk **Virtual Filing Cabinet** pada rancangan OSS v2.

Konsep utama: Filing Cabinet diperlakukan seperti kabinet di dunia nyata yang memiliki slot-slot persyaratan. Pelaku usaha memilih KBLI, lalu sistem membentuk kabinet persyaratan dari registry `persyaratan_register_deduplicated`.

## Demo flow

```text
Biro Jasa Virtual
   |
   v
Fuzzy Search KBLI
   |
   v
Pilih KBLI
   |
   v
Virtual Filing Cabinet
   |
   +-- Group / parent requirement
   +-- Form slot
   +-- Document upload slot
   +-- Payment evidence slot
   +-- Declaration slot
   +-- Photo slot
   |
   v
Async Advisor
   |
   +-- suggest missing slot
   +-- notify incomplete requirement
   |
   v
All required slots complete
   |
   v
Validation -> Orchestration -> Issuance
   |
   v
Credentials Compartment
```

## Data

PoC ini memakai seluruh data dari workbook **persyaratan_register_deduplicated.xlsx** yang diunggah untuk project:

- 1,855 baris persyaratan
- 485 KBLI unik
- Hierarki Level 1 / 2 / 3
- Sektor A-V

Derived data disimpan di:

`apps/web/data/requirements.json`

Tipe kontrol input (form/upload/payment/declaration/photo) adalah **heuristic PoC** berdasarkan wording persyaratan, karena tipe kontrol tersebut tidak tersedia sebagai kolom di workbook sumber.

## Features

- "Biro Jasa Virtual" untuk membantu memilih KBLI
- Fuzzy search berdasarkan kode KBLI dan teks persyaratan terkait
- Physical cabinet-style UI dengan drawer/slot
- Hierarchical requirements
- Form input, file upload metadata, payment proof, declaration, dan photo slot
- Per-slot completion status
- Async suggestion dan notification
- Progress dashboard
- Automatic simulated issuance ketika semua slot lengkap
- Credentials compartment untuk dokumen hasil penerbitan simulasi
- Browser localStorage persistence per KBLI
- OSS-themed visual identity dan official OSS logo
- Responsive UI

## Run

### Docker

```bash
docker compose down
docker compose up --build
```

Open:

```text
http://localhost:3410
```

Virtual Filing Cabinet menggunakan port **3410**.

### Local

```bash
cd apps/web
npm install
npm run dev
```

Local development juga berjalan pada:

```text
http://localhost:3410
```

## Technology

- Next.js 15
- React 19
- Static derived requirement registry
- Client-side async process simulation
- Browser localStorage

## Important

Credential yang muncul pada PoC diberi label **SIMULASI** dan bukan dokumen OSS yang berlaku.

Untuk implementasi production, lihat [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
