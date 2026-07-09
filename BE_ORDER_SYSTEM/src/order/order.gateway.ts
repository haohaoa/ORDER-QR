import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  // websocket là chính, polling chỉ là dự phòng nếu websocket không kết nối được
  transports: ['websocket', 'polling'],
})
export class OrderGateway {
  // Socket Server của toàn hệ thống
  @WebSocketServer()
  server!: Server;

  /**
   * Khi một thiết bị kết nối Socket thành công
   * Ví dụ:
   *  - Điện thoại nhân viên mở ứng dụng
   *  - Frontend gọi io(...)
   */
  handleConnection(client: Socket) {
    console.log(`Socket connected: ${client.id}`);
  }

  /**
   * Khi người dùng tắt app hoặc mất kết nối
   */
  handleDisconnect(client: Socket) {
    console.log(`Socket disconnected: ${client.id}`);
  }

  /**
   * Frontend sau khi đăng nhập sẽ gọi:
   *
   * socket.emit("join-restaurant", restaurantId)
   *
   * Ví dụ:
   *
   * restaurantId = abc123
   *
   * Server sẽ đưa socket này vào Room:
   *
   * restaurant:abc123
   *
   * Sau này chỉ cần gửi vào Room này,
   * tất cả nhân viên của quán đều nhận được.
   */
  @SubscribeMessage('join-restaurant')
  handleJoinRestaurant(
    @MessageBody() restaurantId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!restaurantId) return;

    client.join(`restaurant:${restaurantId}`);

    console.log(
      `Socket ${client.id} joined room restaurant:${restaurantId}`,
    );
  }

  /**
   * Gửi thông báo khi có đơn mới
   *
   * Quy trình:
   *
   * Khách Order
   *      ↓
   * API tạo Order
   *      ↓
   * Lưu MySQL thành công
   *      ↓
   * Gọi:
   * this.orderGateway.emitNewOrder(order)
   *      ↓
   * Chỉ những nhân viên cùng Restaurant mới nhận được
   */
  emitNewOrder(order: any) {
    if (!order?.restaurantId) return;

    this.server
      .to(`restaurant:${order.restaurantId}`)
      .emit('new-order', order);

    console.log(
      `Emit new-order -> restaurant:${order.restaurantId}`,
    );
  }

  /**
   * Gửi khi Order thay đổi
   *
   * Ví dụ:
   *
   * pending
   *      ↓
   * confirmed
   *
   * hoặc
   *
   * completed
   *
   * Frontend sẽ tự cập nhật giao diện.
   */
  emitOrderUpdated(order: any) {
    if (!order?.restaurantId) return;

    this.server
      .to(`restaurant:${order.restaurantId}`)
      .emit('order-updated', order);

    console.log(
      `Emit order-updated -> restaurant:${order.restaurantId}`,
    );
  }

  /**
   * Gửi khi món được xác nhận
   */
  emitOrderItemConfirmed(data: any) {
    if (!data?.restaurantId) return;

    this.server
      .to(`restaurant:${data.restaurantId}`)
      .emit('order-item-confirmed', data);

    console.log(
      `Emit order-item-confirmed -> restaurant:${data.restaurantId}`,
    );
  }
}