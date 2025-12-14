# Hướng dẫn Deploy Backend

## Yêu cầu hệ thống

- Node.js 18+ 
- npm hoặc yarn
- MongoDB đang chạy
- PM2 (khuyến nghị cho production)

## Cài đặt PM2 (khuyến nghị)

```bash
npm install -g pm2
```

## Deploy

### 1. Chuẩn bị môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với các thông tin phù hợp:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/thiepcuoi
JWT_SECRET=your-secret-key-here
UPLOAD_DIR=./uploads
```

### 2. Deploy bằng script

```bash
# Production
./deploy.sh production

# Development
./deploy.sh development

# Staging
./deploy.sh staging
```

### 3. Deploy thủ công

```bash
# Install dependencies
npm ci

# Build TypeScript
npm run build

# Start với PM2
pm2 start ecosystem.config.js --env production

# Hoặc start trực tiếp
NODE_ENV=production node dist/index.js
```

## Quản lý với PM2

```bash
# Xem trạng thái
pm2 status

# Xem logs
pm2 logs thiep-cuoi-backend

# Restart
pm2 restart thiep-cuoi-backend

# Stop
pm2 stop thiep-cuoi-backend

# Delete
pm2 delete thiep-cuoi-backend

# Monitor
pm2 monit

# Save PM2 process list
pm2 save

# Setup PM2 startup script (auto start on boot)
pm2 startup
```

## Database

### Tạo dữ liệu mẫu

```bash
npm run seed
```

## Kiểm tra

Sau khi deploy, kiểm tra health endpoint:

```bash
curl http://localhost:5000/api/health
```

## Troubleshooting

### Port đã được sử dụng

```bash
# Kill process trên port 5000
lsof -ti:5000 | xargs kill -9
```

### MongoDB connection error

- Kiểm tra MongoDB đang chạy: `mongosh` hoặc `mongo`
- Kiểm tra MONGODB_URI trong file .env
- Kiểm tra firewall nếu MongoDB ở server khác

### Build fails

- Xóa node_modules và cài lại: `rm -rf node_modules && npm install`
- Kiểm tra TypeScript errors: `npm run build`

## Production Checklist

- [ ] Cập nhật `.env` với thông tin production
- [ ] Đảm bảo MongoDB đang chạy
- [ ] Kiểm tra port không bị conflict
- [ ] Setup PM2 để auto-restart
- [ ] Setup PM2 startup script cho server restart
- [ ] Kiểm tra logs directory có quyền ghi
- [ ] Kiểm tra uploads directory có quyền ghi
- [ ] Test API endpoints
- [ ] Setup reverse proxy (nginx) nếu cần
- [ ] Setup SSL/HTTPS nếu cần

