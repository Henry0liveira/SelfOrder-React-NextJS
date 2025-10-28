export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageHint: string;
};

export type Restaurant = {
  id: string;
  name: string;
  code: string;
  menu: MenuItem[];
};

export type OrderStatus = 'new' | 'in-progress' | 'ready' | 'completed';

export type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};

export type Order = {
  id: string;
  restaurantId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: Date;
};
