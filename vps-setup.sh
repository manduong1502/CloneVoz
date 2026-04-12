#!/bin/bash
# Script tự động cấu hình VPS Ubuntu/Debian cho dự án Next.js (VOZ Clone)
# Tự động thực hiện các tác vụ: Cài đặt PostgreSQL, Node.js, PM2, Nginx

echo "=== BẮT ĐẦU QUÁ TRÌNH CÀI ĐẶT VPS VOZ CLONE ==="

# 1. Cập nhật hệ thống
echo "=> Cập nhật hệ điều hành..."
apt update && apt upgrade -y
apt install -y curl ufw psmisc git

# 2. Cấu hình Tường lửa (UFW)
echo "=> Mở port HTTP(80), HTTPS(443), SSH(22)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
# ufw --force enable 

# 3. Cài đặt Node.js v20 (LTS) & NPM
echo "=> Cài đặt Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# 4. Cài PM2 toàn cục
echo "=> Cài đặt PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root

# 5. Cài đặt PostgreSQL
echo "=> Cài đặt PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Cấu hình User và DB cho Prisma
echo "=> Thiết lập Database: voz_db, User: voz_user..."
sudo -u postgres psql -c "CREATE USER voz_user WITH PASSWORD 'VozAdmin@@2026';"
sudo -u postgres psql -c "CREATE DATABASE voz_db OWNER voz_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE voz_db TO voz_user;"

# 6. Cài đặt Nginx Web Server
echo "=> Cài đặt web server Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# 7. Hướng dẫn tiếp theo
echo ""
echo "=========================================================="
echo "✅ Cài đặt môi trường VPS THÀNH CÔNG!"
echo ""
echo "Cơ Sở Dữ Liệu PostgreSQL đã được tạo:"
echo " - DB Name: voz_db"
echo " - Username: voz_user"
echo " - Password: VozAdmin@@2026"
echo " - Connection String cho file .env:"
echo "   DATABASE_URL=\"postgresql://voz_user:VozAdmin@@2026@localhost:5432/voz_db?schema=public\""
echo ""
echo "Bạn có thể tiến hành Clone code về và Build theo hướng dẫn."
echo "=========================================================="
