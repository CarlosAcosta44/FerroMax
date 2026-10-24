export class WhatsAppService {
  private static readonly STORE_PHONE = process.env.NEXT_PUBLIC_STORE_WHATSAPP || '573001234567';

  static buildProductInquiryLink(productName: string, sku: string): string {
    const message = encodeURIComponent(
      `¡Hola FerroMax! Tengo una consulta sobre el producto "${productName}" (Ref: ${sku}) que vi en su catálogo web.`
    );
    return `https://wa.me/${this.STORE_PHONE}?text=${message}`;
  }

  static buildGeneralInquiryLink(): string {
    const message = encodeURIComponent(
      '¡Hola FerroMax! Deseo hacer una consulta sobre herramientas y materiales de ferretería.'
    );
    return `https://wa.me/${this.STORE_PHONE}?text=${message}`;
  }

  static buildOrderInquiryLink(orderNumber: string): string {
    const message = encodeURIComponent(
      `¡Hola FerroMax! Deseo consultar el estado de mi pedido #${orderNumber}.`
    );
    return `https://wa.me/${this.STORE_PHONE}?text=${message}`;
  }
}
