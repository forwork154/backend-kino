import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { PaymentService } from './core/payment/payment.service';
import { PaymentDataDto } from './core/payment/dto/payment-data.dto';
import { PaymentCodeDto } from './core/payment/dto/payment-code.dto';

@WebSocketGateway()
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private paymentService: PaymentService) {}

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('AppGateway');

  @SubscribeMessage('PAYMENT_DATA_SEND')
  handlePaymentData(client: Socket, payload: PaymentDataDto): void {
    this.paymentService.submitPaymentData(payload, client);
  }

  // @SubscribeMessage('PAYMENT_CODE_SEND')
  // handlePaymentCode(client: Socket, payload: PaymentCodeDto): void {
  //   this.paymentService.submitPaymentCode(payload, client);
  // }

  afterInit(server: Server): void {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }
}
