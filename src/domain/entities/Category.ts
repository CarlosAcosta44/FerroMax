export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string;
  displayOrder: number;
  createdAt: Date;
}
