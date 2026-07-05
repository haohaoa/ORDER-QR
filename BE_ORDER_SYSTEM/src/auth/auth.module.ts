// Import Module decorator từ NestJS
import { Module } from '@nestjs/common';
// Import JwtModule để xử lý JWT token
import { JwtModule } from '@nestjs/jwt';
// Import PassportModule để tích hợp Passport.js cho authentication
import { PassportModule } from '@nestjs/passport';
// Import ConfigModule và ConfigService để quản lý cấu hình
import { ConfigModule, ConfigService } from '@nestjs/config';
// Import các service và controller của module auth
import { AuthService } from './services/auth.service';
import { OwnerService } from './services/owner.service';
import { AuthController } from './controllers/auth.controller';
// Import các strategy cho JWT và local authentication
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
// Import PrismaModule để sử dụng database
import { PrismaModule } from '../prisma/prisma.module';

// Định nghĩa module Auth để xử lý xác thực và phân quyền
@Module({
  // Danh sách các module được import
  imports: [
    ConfigModule, // Để truy cập biến môi trường
    PrismaModule, // Để kết nối database
    PassportModule, // Để sử dụng Passport strategies
    // Cấu hình JwtModule một cách bất đồng bộ để sử dụng ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule để inject ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev_jwt_secret_change_me', // Lấy secret key từ biến môi trường hoặc fallback (dev)
        signOptions: { expiresIn: '1h' }, // Token hết hạn sau 1 giờ
      }),
      inject: [ConfigService], // Inject ConfigService vào factory
    }),
  ],
  // Controller xử lý các endpoint liên quan đến auth
  controllers: [AuthController],
  // Các provider (service, strategy) được cung cấp bởi module
  providers: [AuthService, OwnerService, JwtStrategy, LocalStrategy],
  // Export AuthService để các module khác có thể sử dụng
  exports: [AuthService, OwnerService],
})
export class AuthModule {}