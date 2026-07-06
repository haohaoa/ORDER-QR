import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async resolveUserRole(userId: string): Promise<{ role: string; restaurantId: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, restaurantId: true },
    });

    return { role: user?.role ?? 'service', restaurantId: user?.restaurantId ?? null };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _password, ...result } = user;
      const resolved = await this.resolveUserRole(user.id);
      return { ...result, role: resolved.role, restaurantId: resolved.restaurantId };
    }

    return null;
  }

  async login(user: any) {
    const resolved = await this.resolveUserRole(user.id);
    const role = user.role ?? resolved.role;
    const restaurantId = user.restaurantId ?? resolved.restaurantId;
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role,
      restaurantId,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken: hashed } });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role,
        restaurantId,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);
      const userId = payload.sub;
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const matches = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!matches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const resolved = await this.resolveUserRole(user.id);
      const role = resolved.role;
      const restaurantId = resolved.restaurantId;
      const newPayload: JwtPayload = { email: user.email, sub: user.id, role, restaurantId };
      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      const newHashed = await bcrypt.hash(newRefreshToken, 10);
      await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken: newHashed } });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          role,
          restaurantId,
        },
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}