
import type { Restaurant, Order, OrderStatus } from '@/types';
import imageData from './placeholder-images.json';

const images = imageData.placeholderImages;

// This mock data is now only used for illustrative purposes or seeding,
// as the app primarily fetches data from Firestore.
export const restaurantData: Restaurant[] = [
  {
    id: '1',
    name: 'The Coral Cafe',
    code: 'CORAL123',
    ownerUid: 'owner-coral-cafe', // Placeholder UID
  },
];

// This function is kept for potential testing or seeding purposes
export const generateOrdersData = (restaurantId: string): Omit<Order, 'id'>[] => {
  const statuses: OrderStatus[] = ['new', 'in-progress', 'ready', 'completed'];
  const orders: Omit<Order, 'id'>[] = [];
  const menuItems = [ // simplified menu for mock orders
      { id: 'm1', name: 'Gourmet Burger', price: 12.99 },
      { id: 'm2', name: 'Pepperoni Pizza', price: 15.50 },
      { id: 'm3', name: 'Garden Salad', price: 8.00 },
  ];

  for (let i = 0; i < 8; i++) {
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let total = 0;
    for (let j = 0; j < numItems; j++) {
      const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
      const quantity = Math.floor(Math.random() * 2) + 1;
      items.push({ 
          menuItemId: menuItem.id,
          name: menuItem.name,
          quantity,
          price: menuItem.price 
      });
      total += menuItem.price * quantity;
    }
    
    orders.push({
      restaurantId: restaurantId,
      customerUid: `customer-${i}`,
      items,
      total,
      status: statuses[i % statuses.length],
      timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 2), // Firestore expects a Timestamp, but for mocks, Date is fine
    } as any);
  }
  return orders;
};

// DEPRECATED: This function is no longer used by the main app flow.
// It is kept for reference or potential testing.
export const findRestaurantByCode = (code: string): Restaurant | undefined => {
  // In a real component, you would use a Firestore query.
  const allRestaurants: Restaurant[] = restaurantData;
  return allRestaurants.find((r: Restaurant) => r.code.toUpperCase() === code.toUpperCase());
};
