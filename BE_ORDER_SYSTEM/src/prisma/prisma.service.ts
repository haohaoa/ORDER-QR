// Import Injectable để đánh dấu service có thể được inject, OnModuleInit để hook lifecycle
import { Injectable, OnModuleInit } from "@nestjs/common";
// Import PrismaClient để tương tác với database
import { PrismaClient } from "@prisma/client";

// Định nghĩa service Prisma để quản lý kết nối database
@Injectable()
export class PrismaService
  extends PrismaClient // Kế thừa từ PrismaClient để sử dụng các phương thức database
  implements OnModuleInit // Triển khai interface để thực hiện logic khi module khởi tạo
{
  // Phương thức được gọi khi module khởi tạo, dùng để kết nối đến database
  async onModuleInit() {
    await this.$connect(); // Kết nối đến database MySQL thông qua Prisma
  }
}
