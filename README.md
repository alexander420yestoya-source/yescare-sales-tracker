# YESCARE Sales Balance Tracker

Sistem disiplin, SLA, dan pembelajaran internal untuk tim sales B2B.

## Stack

- **Backend**: Node.js + Express + Prisma ORM + PostgreSQL
- **Frontend**: Next.js 14 (App Router) + TailwindCSS
- **Auth**: JWT (email/password)

---

## Cara Setup

### 1. Install PostgreSQL

Download dan install PostgreSQL di mesin lokal kamu.
Buat database baru: `yescare_db`

### 2. Setup Backend

```bash
cd apps/backend
npm install

# Copy file env
cp .env.example .env
# Edit .env → isi DATABASE_URL yang sesuai

# Generate Prisma client
npm run db:generate

# Jalankan migrasi
npm run db:push

# Isi data contoh
npm run db:seed

# Jalankan server
npm run dev
```

Backend akan berjalan di: `http://localhost:4000`

### 3. Setup Frontend

```bash
cd apps/frontend
npm install

# Copy file env
cp .env.local.example .env.local
# Edit jika backend di port yang berbeda

# Jalankan frontend
npm run dev
```

Frontend akan berjalan di: `http://localhost:3000`

---

## Akun Demo

| Role  | Email                  | Password     |
|-------|------------------------|--------------|
| Owner | owner@yescare.com      | password123  |
| Sales | andi@yescare.com       | password123  |
| Sales | sari@yescare.com       | password123  |

---

## Fitur

### Sales
- ✅ **Dashboard** — ringkasan hari ini + flag mingguan
- ✅ **Komitmen** — buat task harian, tandai selesai, request perpanjangan
- ✅ **Aktivitas** — input aktivitas harian ≤60 detik
- ✅ **Mingguan** — lihat skor + micro lessons berbasis flag
- ✅ **Coaching** — request coaching ke owner

### Owner
- ✅ **Tim Sales** — overview performa + health indicator
- ✅ **Extension** — approve/reject request perpanjangan
- ✅ **Coaching** — tangani coaching requests
- ✅ **Detail Sales** — drill down per individu + 30-day trend

---

## Rule-Based Flags

| Flag | Kondisi |
|------|---------|
| Risiko Disiplin Waktu | SLA On-Time < 80% |
| Risiko Inisiatif Rendah | Meeting = 0 dalam 7 hari |
| Pipeline Stagnan | Ada akun tanpa aktivitas >14 hari |
| Pola Over-Komitmen | Extension >3 dalam 7 hari |
| Pola Penjualan Reaktif | Preventive = 0 dalam 14 hari |

---

## Struktur Folder

```
yescare-app/
  apps/
    backend/
      src/
        routes/      ← API endpoints
        services/    ← Business logic
        middleware/  ← Auth JWT
        jobs/        ← Cron weekly summary
      prisma/
        schema.prisma
        seed.js
    frontend/
      app/
        (auth)/login/
        (dashboard)/
          dashboard/
          tasks/
          activity/
          weekly/
          coaching/
          owner/
      lib/            ← api.js, auth.js, utils.js
```

---

Built for internal use by YESCARE team.
