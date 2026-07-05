// Import Injectable và UnauthorizedException từ NestJS
import { Injectable, UnauthorizedException } from '@nestjs/common';
// Import PassportStrategy để tích hợp với Passport.js
import { PassportStrategy } from '@nestjs/passport';
// Import ExtractJwt và Strategy từ passport-jwt
import { ExtractJwt, Strategy } from 'passport-jwt';
// Import ConfigService để lấy cấu hình
import { ConfigService } from '@nestjs/config';
// Import PrismaService để truy cập database
import { PrismaService } from '../../prisma/prisma.service';
// Import interface JwtPayload
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// Định nghĩa strategy JWT để xử lý xác thực dựa trên JWT token
@Injectable()
// GIẢI MÃ TOKEN JWT LẤY THÔNG TIN USER
export class JwtStrategy extends PassportStrategy(Strategy) {
  // Constructor để inject dependencies và cấu hình strategy
  constructor(
    private configService: ConfigService, // Để lấy JWT secret
    private prisma: PrismaService, // Để truy cập database
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Lấy token từ header Authorization
      ignoreExpiration: false, // Không bỏ qua token hết hạn
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret', // Secret key để verify token
    });
  }

  // Phương thức validate được gọi sau khi token được verify thành công
  async validate(payload: JwtPayload) {
    // Tìm user trong database dựa trên ID từ payload
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub }, // sub là ID người dùng trong payload
    });

    // Nếu không tìm thấy user, ném exception Unauthorized
    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Trả về thông tin user để gắn vào request.user
    return user;
  }
}