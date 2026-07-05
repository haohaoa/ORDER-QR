// Import Injectable từ NestJS
import { Injectable } from '@nestjs/common';
// Import AuthGuard từ @nestjs/passport
import { AuthGuard } from '@nestjs/passport';

// Định nghĩa guard local để xử lý đăng nhập bằng email và password
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // Guard này sử dụng strategy 'local' để validate thông tin đăng nhập
}