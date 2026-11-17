# SSL / TLS Certificates Directory

Folder ini digunakan untuk menyimpan sertifikat SSL/TLS untuk Nginx reverse proxy (`docker-compose.yml` me-mount folder ini ke `/etc/nginx/certs:ro`).

## File yang Dibutuhkan Nginx:
1. `fullchain.pem` : Sertifikat publik / full chain certificate
2. `privkey.pem`   : Private key sertifikat

> **Catatan Keamanan:**
> File sertifikat asli dan private key (`*.pem`, `*.key`) **di-ignore oleh Git** (melalui `.gitignore`) agar tidak bocor ke repository publik/bersama.

---

## Cara Generate Sertifikat (Development / Lokal)

### Opsi 1: Menggunakan Docker (Rekomendasi, tanpa perlu install OpenSSL di Windows)
Jalankan perintah ini di root project:
```bash
docker run --rm -v ${PWD}/certs:/certs alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/privkey.pem -out /certs/fullchain.pem -subj "/CN=erp.koperasi.local"
```

### Opsi 2: Menggunakan OpenSSL (Linux / WSL / Git Bash / macOS)
Jalankan script:
```bash
bash scripts/generate_certs.sh
```
Atau perintah langsung:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certs/privkey.pem -out certs/fullchain.pem -subj "/CN=erp.koperasi.local"
```

---

## Production
Untuk production, gunakan sertifikat valid dari Let's Encrypt (Certbot) atau otoritas sertifikat (CA) tepercaya, lalu letakkan `fullchain.pem` dan `privkey.pem` di folder ini.
