import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function randomBool() {
  return Math.random() < 0.5;
}

function randomPrice(min = 50000, max = 200000) {
  const value = Math.floor(Math.random() * (max - min)) + min;
  return Math.round(value / 10000) * 10000;
}

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

  const hashedPassword = await bcrypt.hash("123456", 10);

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Demo Restaurant",
      slug: "demo-restaurant",
      address: "123 Main Street",
      phone: "0123456789",
      email: "restaurant@example.com",
      currency: "VND",
      description: "Restaurant seed data",
    },
  });

  await prisma.user.create({
    data: {
      name: "Owner User",
      email: "owner@gmail.com",
      password: hashedPassword,
      phone: "0123456789",
      role: "owner",
      restaurantId: restaurant.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@gmail.com",
      password: hashedPassword,
      phone: "0123456789",
      role: "admin",
      restaurantId: restaurant.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Manager User",
      email: "manager@gmail.com",
      password: hashedPassword,
      phone: "0987654321",
      role: "manager",
      restaurantId: restaurant.id,
    },
  });

  const categories = [] as Array<{ id: string; name: string }>;
  for (let i = 1; i <= 4; i++) {
    const category = await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: `Category ${i}`,
        sortOrder: i,
      },
    });
    categories.push(category);
  }

  for (let i = 0; i < DISH_NAMES.length; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];

    await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: DISH_NAMES[i],
        description: `Món ${DISH_NAMES[i]} thơm ngon, chế biến trong ngày`,
        price: randomPrice(),
        available: true,
        status: "active",
        images: {
          create: [
            { image: `anh(1).jpg` },
            { image: `anh(2).jpg` },
            { image: `anh(3).jpg` },
          ],
        },
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

  for (let i = 1; i <= 10; i++) {
    await prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        name: `Table ${i}`,
        qrCode: `QR-${i}-${Math.floor(Math.random() * 1000)}`,
        status: "empty",
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
