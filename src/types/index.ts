

import { Timestamp, type FieldValue } from "firebase/firestore";

export type Ingredient = {
  name: string;
  quantity: number; // quantity needed per recipe/serving
  unit: string; // e.g. 'g', 'ml', 'unidade', 'colher'
};

export type AddonOption = {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category?: string; // e.g. 'Tamanho', 'Bebidas', 'Extras'
};

export type SizeOption = {
  name: string;
  price: number;
};

export type MenuItem = {
  id: string; // Firestore document ID
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageHint: string;
  ingredients?: Ingredient[]; // List of ingredients with quantities
  sizes?: SizeOption[];
  addons?: AddonOption[];
  promoted?: boolean;
};

export type Restaurant = {
  id: string; // Firestore document ID
  name:string;
  code: string;
  ownerUid: string; // UID of the Firebase user who owns this restaurant
  logoUrl?: string;
  bannerUrl?: string;
  hours?: string; // freeform hours description
  deliveryEnabled?: boolean;
  pickupEnabled?: boolean;
  cuisineType?: string;
  description?: string;
  rating?: number;
  deliveryTime?: string;
  deliveryFee?: number;
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
  selectedSize?: SizeOption;
    selectedAddons?: AddonOption[];
    observation?: string;
};


// Represents an item in the cart in the UI, containing the full MenuItem object
export type CartItem = {
  id: string; // This is the cart item's document ID from Firestore
  menuItem: MenuItem;
  quantity: number;
  selectedSize?: SizeOption;
  selectedAddons?: AddonOption[];
  observation?: string;
};

export type OrderItem = {
  menuItemId: string; // The ID of the menu item
  name: string;
  quantity: number;
  price: number;
  category?: string; // Category for analytics
  selectedSize?: SizeOption;
  addons?: AddonOption[];
  observation?: string;
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
  timestamp: Timestamp | FieldValue; // Firestore Timestamp or server timestamp placeholder while writing
  customerUid: string; // The UID of the customer who placed the order
  customer?: { // Optional: denormalized customer data for quick display
    name: string;
    email: string;
  },
  deliveryType?: 'pickup' | 'delivery';
  deliveryAddress?: string;
  customerNote?: string;
  rating?: number; // Optional: Customer rating from 1 to 5
  review?: string; // Optional: Customer's text review
};

// Stock item for inventory management
export type StockItem = {
  id: string; // Firestore document ID
  name: string;
  currentStock: number;
  unit: string;
  minStock?: number; // Alert threshold
  lastUpdated?: Timestamp;
};

export type MockCustomer = {
    name: string;
    email: string;
};
