// Import decorator Module từ NestJS để định nghĩa module
import { Module } from '@nestjs/common';
// Import ConfigModule để quản lý cấu hình ứng dụng
import { ConfigModule } from '@nestjs/config';
// Import các controller và service của ứng dụng chính
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Import các module con của ứng dụng
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TableModule } from './table/table.module';
import { CategoryModule } from './category/category.module';
import { MenuItemModule } from './menu-item/menu-item.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { OptionItemModule } from './option-item/option-item.module';
import { ImageItemModule } from './image-item/image-item.module';

// Định nghĩa module chính của ứng dụng
@Module({
  // Danh sách các module được import vào module chính
  imports: [
    // Cấu hình ConfigModule để load biến môi trường toàn cục
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Module quản lý kết nối database với Prisma
    PrismaModule,
    // Module xử lý xác thực và phân quyền
    AuthModule,
    // Module quản lý người dùng
    UserModule,
    // Module quản lý bàn ăn
    TableModule,
    // Module quản lý danh mục món ăn
    CategoryModule,
    // Module quản lý món ăn
    MenuItemModule,
    // Module quản lý đơn hàng
    OrderModule,
    // Module quản lý thanh toán
    PaymentModule,
    // Module quản lý tùy chọn món ăn
    OptionItemModule,
    // Module quản lý hình ảnh món ăn
    ImageItemModule,
  ],
  // Danh sách các controller được đăng ký trong module này
  controllers: [AppController],
  // Danh sách các provider (service) được cung cấp bởi module này
  providers: [AppService],
})
export class AppModule {}
