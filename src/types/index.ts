
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

// Represents an item as it is stored in the Firestore cart subcollection
export type FirestoreCartItem = {
    id: string; // Firestore document ID for the cart item
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    description?: string;
    category?: string;
    imageHint?: string;
};


// Represents an item in the cart in the UI, containing the full MenuItem object
export type CartItem = {
  id: string; // This is the cart item's document ID from Firestore
  menuItem: MenuItem;
  quantity: number;
};

export type OrderItem = {
  menuItemId: string; // The ID of the menu item
  name: string;
  quantity: number;
  price: number;
};

export type CustomerProfile = {
  uid: string; // Corresponds to Firebase Auth UID
  name: string;
  email: string;
  phone?: string;
};

export type Order = {
  id: string; // Firestore document ID
  restaurantId: string; // The ID of the restaurant document
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  timestamp: Timestamp; // Firestore Timestamp
  customerUid: string; // The UID of the customer who placed the order
  customer?: { // Optional: denormalized customer data for quick display
    name: string;
    email: string;
  },
  rating?: number; // Optional: Customer rating from 1 to 5
  review?: string; // Optional: Customer's text review
};
