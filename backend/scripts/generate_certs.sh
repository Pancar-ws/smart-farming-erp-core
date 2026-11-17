# scripts/generate_certs.sh
# Generate self-signed certificate for local dev / testing
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/privkey.pem \
  -out certs/fullchain.pem \
  -subj "/C=ID/ST=Jawa Barat/L=Bogor/O=Koperasi Tani/CN=erp.koperasi.local"
echo "SSL certificates generated in certs/ directory."

