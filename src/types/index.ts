
import { Timestamp } from "firebase/firestore";

export type MenuItem = {
  id: string; // Firestore document ID
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageHint: string;
};

export type Restaurant = {
  id: string; // Firestore document ID
  name:string;
  code: string;
  ownerUid: string; // UID of the Firebase user who owns this restaurant
};

export type OrderStatus = 'new' | 'in-progress' | 'ready' | 'completed';

export type CartItem = {
  menuItemId: string; // The ID of the menu item
  name: string;
  quantity: number;
  price: number;
};

export type CustomerAccount = {
  uid: string; // Corresponds to Firebase Auth UID
  name: string;
  email: string;
  phone?: string;
  allowPromotions: boolean;
};

export type Order = {
  id: string; // Firestore document ID
  restaurantId: string; // The ID of the restaurant document
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: Timestamp; // Firestore Timestamp
  customerUid: string; // The UID of the customer who placed the order
  customer?: { // Optional: denormalized customer data for quick display
    name: string;
    email: string;
  }
};
