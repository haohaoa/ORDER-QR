import { PrismaClient, Category } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ===== HELPER =====
function randomBool() {
  return Math.random() < 0.5;
}

// Giá tiền làm tròn theo 10.000 VNĐ
function randomPrice(min = 50000, max = 200000) {
  const value = Math.floor(Math.random() * (max - min)) + min;
  return Math.round(value / 10000) * 10000;
}

// ===== DANH SÁCH 40 TÊN MÓN =====
const DISH_NAMES = [
  "Phở bò tái",
  "Phở gà",
  "Bún bò Huế",
  "Bún riêu cua",
  "Bún chả Hà Nội",
  "Cơm tấm sườn",
  "Cơm gà xối mỡ",
  "Cơm chiên hải sản",
  "Mì xào bò",
  "Mì xào hải sản",
  "Hủ tiếu Nam Vang",
  "Bánh mì thịt",
  "Bánh mì xíu mại",
  "Bánh cuốn",
  "Cháo sườn",
  "Cháo gà",
  "Gỏi cuốn",
  "Nem rán",
  "Chả giò",
  "Bánh xèo",

  // ===== 20 MÓN THÊM =====
  "Lẩu thái hải sản",
  "Lẩu bò nhúng dấm",
  "Cá kho tộ",
  "Thịt kho trứng",
  "Canh chua cá",
  "Gà kho sả ớt",
  "Sườn xào chua ngọt",
  "Bò lúc lắc",
  "Bò kho bánh mì",
  "Gà chiên nước mắm",
  "Mực xào sa tế",
  "Tôm rim mặn ngọt",
  "Ốc xào me",
  "Ốc luộc sả",
  "Đậu hũ chiên giòn",
  "Rau muống xào tỏi",
  "Canh cải thịt bằm",
  "Canh rong biển",
  "Trứng chiên hành",
  "Salad trộn dầu giấm",
];

async function main() {
  console.log("🌱 Seeding data...");

  // =====================
  // 1 USER (ADMIN)
  // =====================
  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await prisma.user.create({
    data: {
      name: "Admin User",
      role: "admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      contractType: "monthly",
      address: "123 Main Street",
      phone: "0123456789",
    },
  });

  // =====================
  // 4 CATEGORIES
  // =====================
  const categories: Category[] = [];
  for (let i = 1; i <= 4; i++) {
    const category = await prisma.category.create({
      data: {
        name: `Category ${i}`,
        sortOrder: i,
        user: {
          connect: { id: user.id },
        },
      },
    });
    categories.push(category);
  }

  // =====================
  // MENU ITEMS (40 MÓN)
  // =====================
  for (let i = 0; i < DISH_NAMES.length; i++) {
    const category =
      categories[Math.floor(Math.random() * categories.length)];

    await prisma.menuItem.create({
      data: {
        name: DISH_NAMES[i],
        description: `Món ${DISH_NAMES[i]} thơm ngon, chế biến trong ngày`,
        price: randomPrice(),
        available: true,

        user: {
          connect: { id: user.id },
        },

        category: {
          connect: { id: category.id },
        },

        // ===== IMAGES =====
        // images: {
        //   create: [
        //     { image: `anh(${i + 1}).jpg` },
        //     { image: `anh(${i + 2}).jpg` },
        //     { image: `anh(${i + 3}).jpg` },
        //   ],
        // },
        images: {
            create: [
              { image: `anh(1).jpg` },
              { image: `anh(2).jpg` },
              { image: `anh(3).jpg` },
            ],
          },
        // ===== OPTIONS =====
        options: {
          create: Array.from({
            length: Math.floor(Math.random() * 3) + 1,
          }).map((_, idx) => ({
            name: `Option ${idx + 1}`,
            required: randomBool(),
          })),
        },
      },
    });
  }

  // =====================
  // 10 TABLES
  // =====================
  for (let i = 1; i <= 10; i++) {
    await prisma.table.create({
      data: {
        name: `Table ${i}`,
        qrCode: `QR-${i}-${Math.floor(Math.random() * 1000)}`,
        status: "empty",
        user: {
          connect: { id: user.id },
        },
      },
    });
  }

  console.log("✅ Seed data created successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Seed error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
