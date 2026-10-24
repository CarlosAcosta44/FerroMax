import { Payment, PaymentMethod, PaymentStatus } from '../entities/Payment';

export interface CreatePaymentParams {
  orderId: string;
  paymentMethod: PaymentMethod;
  amountCop: number;
  status: PaymentStatus;
  transactionRef: string;
  receiptNumber: string;
  gatewayPayload?: Record<string, unknown>;
}

export interface IPaymentRepository {
  create(params: CreatePaymentParams): Promise<Payment>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByReceiptNumber(receiptNumber: string): Promise<Payment | null>;
}
