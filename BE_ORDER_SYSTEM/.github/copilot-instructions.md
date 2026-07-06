# Yêu cầu thiết kế lại Database cho hệ thống QR Order

## Bối cảnh

Tôi đang xây dựng một hệ thống Order bằng QR Code sử dụng NestJS + Prisma + MySQL.

Đối tượng hướng đến là các quán ăn, quán cà phê quy mô nhỏ đến vừa, nhưng kiến trúc phải đủ tốt để sau này triển khai dưới dạng SaaS cho nhiều quán khác nhau.

Hiện tại database của tôi đang lấy **User (chủ quán)** làm trung tâm.

Ví dụ:

* Table.userId
* MenuItem.userId
* Category.userId

Khi khách quét QR:

```
QR Code
→ Table
→ userId (chủ quán)
→ lấy Menu của user đó
```

Thiết kế này hoạt động khi mỗi quán chỉ có một chủ.

Tuy nhiên khi phát sinh nhiều nhân viên thì gặp vấn đề:

* Không xác định được nhân viên thuộc quán nào.
* Menu, Category, Table không nên thuộc nhân viên.
* Nếu chủ quán thay đổi thì toàn bộ dữ liệu phải đổi theo.
* User đang vừa là tài khoản đăng nhập vừa là thực thể đại diện cho quán, dẫn đến thiết kế không hợp lý.

---

## Mục tiêu mới

Tôi muốn refactor toàn bộ hệ thống theo hướng **Restaurant (Quán)** là trung tâm dữ liệu.

Restaurant sẽ là đơn vị sở hữu toàn bộ dữ liệu của quán.

Ví dụ:

```
Restaurant
│
├── Users
├── Tables
├── Categories
├── MenuItems
├── Orders
├── Payments
```

Mọi dữ liệu đều thuộc Restaurant, không thuộc User.

User chỉ còn là tài khoản đăng nhập.

Ví dụ:

Restaurant A

* Chủ quán
* Nhân viên 1
* Nhân viên 2

đều có chung restaurantId.

---

## Nghiệp vụ

### Chủ quán

* Tạo tài khoản.
* Tạo Restaurant.
* Quản lý Menu.
* Quản lý Bàn.
* Quản lý Nhân viên.

### Nhân viên

* Đăng nhập.
* Chỉ thao tác trên dữ liệu của Restaurant mình.
* Không sở hữu Menu hay Table.

### Khách

Quét QR.

Luồng:

```
QR
↓
Table
↓
Restaurant
↓
Menu
```

Không còn tìm thông qua User.

---

## Order

Một bàn có thể phát sinh nhiều Order.

Ví dụ:

18:00

Order #1

18:15

Order #2

18:40

Order #3

Khi thanh toán:

Lấy tất cả Order của bàn có trạng thái chưa hoàn thành.

Tính tổng.

Thanh toán một lần.

Sau đó cập nhật tất cả Order thành completed.

Table chuyển về empty.

---

## Nhân viên

Tôi không cần hệ thống theo dõi bếp.

Quy trình:

Khách đặt

↓

Order = pending

↓

Nhân viên xác nhận

↓

In phiếu xuống bếp

↓

Bếp nấu (không dùng hệ thống)

↓

Nhân viên phục vụ

↓

Thanh toán

Do đó không cần quản lý trạng thái từng món quá phức tạp như hệ thống POS lớn.

---

## Yêu cầu AI

Hãy thiết kế lại toàn bộ Prisma Schema theo các tiêu chí sau:

1. Restaurant là trung tâm của toàn bộ dữ liệu.
2. User chỉ là tài khoản đăng nhập.
3. Restaurant có nhiều User.
4. Restaurant có nhiều Table.
5. Restaurant có nhiều Category.
6. Restaurant có nhiều MenuItem.
7. Restaurant có nhiều Order.
8. Quan hệ giữa các bảng phải chuẩn hóa, tránh dư thừa.
9. Thiết kế phải dễ mở rộng cho nhiều quán (multi-tenant SaaS).
10. Giữ nguyên những phần nghiệp vụ đang hợp lý như:

    * Order
    * OrderItem
    * Payment
11. Nếu phát hiện thiết kế chưa hợp lý, hãy giải thích lý do và đề xuất phương án tối ưu hơn.
12. Ưu tiên kiến trúc sạch, dễ bảo trì, dễ mở rộng và đúng với thực tế triển khai cho nhiều quán.
