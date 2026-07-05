// Import các module cần thiết từ NestJS và các thư viện liên quan
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from './app.module';
import { join } from 'path';

// Hàm bootstrap để khởi tạo và chạy ứng dụng NestJS
async function bootstrap() {
  // Tạo instance của ứng dụng NestJS từ AppModule
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Áp dụng ValidationPipe toàn cục để tự động validate dữ liệu đầu vào
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  // Bật CORS để cho phép frontend truy cập từ domain khác
  app.enableCors(); // Enable CORS for frontend
  // Serve uploaded images from /uploads
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });
  // Lắng nghe trên port được chỉ định trong biến môi trường hoặc mặc định là 3000
  await app.listen(process.env.PORT ?? 3000);
}
// Gọi hàm bootstrap để khởi động ứng dụng
bootstrap();
