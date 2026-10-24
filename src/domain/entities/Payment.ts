export type PaymentMethod =
  | 'pse'
  | 'credit_card'
  | 'debit_card'
  | 'cash_on_delivery'
  | 'bank_transfer';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  transactionRef: string;
  paymentMethod: PaymentMethod;
  amountCop: number;
  status: PaymentStatus;
  receiptNumber: string;
  gatewayPayload?: Record<string, unknown>;
  paidAt?: Date | null;
  createdAt: Date;
}
