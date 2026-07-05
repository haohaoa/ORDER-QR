// Import Injectable để đánh dấu service có thể được inject
import { Injectable, UnauthorizedException } from '@nestjs/common';
// Import JwtService để tạo và verify JWT token
import { JwtService } from '@nestjs/jwt';
// Import PrismaService để tương tác với database
import { PrismaService } from '../../prisma/prisma.service';
// Import type User từ Prisma
import { User } from '@prisma/client';
// Import bcrypt để hash và so sánh mật khẩu
import * as bcrypt from 'bcrypt';
// Import interface JwtPayload để định nghĩa payload của JWT
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// Định nghĩa service Auth để xử lý logic xác thực người dùng
@Injectable()
export class AuthService {
  // Constructor để inject các dependency
  constructor(
    private prisma: PrismaService, // Service để truy cập database
    private jwtService: JwtService, // Service để xử lý JWT
  ) {}

  // Phương thức validate thông tin đăng nhập của người dùng
  async validateUser(email: string, password: string): Promise<any> {
    // Tìm người dùng theo email trong database
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Nếu tìm thấy user và mật khẩu khớp (so sánh hash)
    if (user && (await bcrypt.compare(password, user.password))) {
      // Loại bỏ trường password khỏi kết quả trả về
      const { password, ...result } = user;
      return result;
    }
    // Trả về null nếu không hợp lệ
    return null;
  }

  // Phương thức đăng nhập, tạo JWT token cho người dùng
  async login(user: User) {
    // Tạo payload cho JWT chứa thông tin cần thiết
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id, // Subject là ID người dùng
      role: user.role, // Vai trò của người dùng
    };
    // Trả về access token và thông tin user
    const accessToken = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' })

    // store hashed refresh token
    const hashed = await bcrypt.hash(refreshToken, 10)
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken: hashed } })

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    }
  }

  // Refresh access token using a valid refresh token
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken)
      const userId = payload.sub
      const user = await this.prisma.user.findUnique({ where: { id: userId } })
      if (!user || !user.refreshToken) throw new UnauthorizedException('Invalid refresh token')

      const matches = await bcrypt.compare(refreshToken, user.refreshToken)
      if (!matches) throw new UnauthorizedException('Invalid refresh token')

      const newPayload: JwtPayload = { email: user.email, sub: user.id, role: user.role }
      const newAccessToken = this.jwtService.sign(newPayload)
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' })

      const newHashed = await bcrypt.hash(newRefreshToken, 10)
      await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken: newHashed } })

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      }
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }
}