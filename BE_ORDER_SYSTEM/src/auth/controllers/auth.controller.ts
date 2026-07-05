// Import các decorator và guard từ NestJS
import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
// Import AuthService để xử lý logic đăng nhập
import { AuthService } from '../services/auth.service';
// Import LocalAuthGuard để bảo vệ endpoint đăng nhập
import { LocalAuthGuard } from '../guards/local-auth.guard';
// Import DTO cho dữ liệu đăng nhập
import { LoginDto } from '../dto/login.dto';

// Định nghĩa controller cho các endpoint liên quan đến xác thực
@Controller('auth') // Route prefix là 'auth'
export class AuthController {
  // Constructor để inject AuthService
  constructor(private authService: AuthService) {}

  // Endpoint POST /auth/login để đăng nhập
  @UseGuards(LocalAuthGuard) // Sử dụng guard để validate thông tin đăng nhập
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    // Gọi service để tạo token và trả về thông tin đăng nhập
    return this.authService.login(req.user);
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    return this.authService.refresh(body.refresh_token)
  }
}