// Import Injectable và UnauthorizedException từ NestJS
import { Injectable, UnauthorizedException } from '@nestjs/common';
// Import PassportStrategy để tích hợp với Passport.js
import { PassportStrategy } from '@nestjs/passport';
// Import Strategy từ passport-local
import { Strategy } from 'passport-local';
// Import AuthService để validate thông tin đăng nhập
import { AuthService } from '../services/auth.service';

// Định nghĩa strategy local để xử lý đăng nhập bằng email và password
@Injectable()
// KIỂM TRA EMAIL + PASSWORD
export class LocalStrategy extends PassportStrategy(Strategy) {
  // Constructor để inject AuthService và cấu hình strategy
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Sử dụng email thay vì username mặc định
    });
  }

  // Phương thức validate được gọi với email và password từ request
  async validate(email: string, password: string): Promise<any> {
    // Gọi AuthService để validate thông tin người dùng
    const user = await this.authService.validateUser(email, password);
    // Nếu không hợp lệ, ném exception Unauthorized
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }
    // Trả về thông tin user để gắn vào request.user
    return user;
  }
}