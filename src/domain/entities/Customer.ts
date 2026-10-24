export type DocumentType = 'CC' | 'NIT' | 'CE' | 'PP';

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string | null;
  address: string | null;
  city: string;
  createdAt: Date;
  updatedAt: Date;
}
