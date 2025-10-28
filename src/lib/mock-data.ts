import type { Restaurant, Order, OrderStatus } from '@/types';
import imageData from './placeholder-images.json';

const images = imageData.placeholderImages;

export const restaurantData: Restaurant[] = [
  {
    id: '1',
    name: 'The Coral Cafe',
    code: 'CORAL123',
    email: 'staff@coral.cafe',
    menu: [
      { id: 'm1', name: 'Gourmet Burger', description: 'Juicy beef patty, cheddar, and special sauce.', price: 12.99, category: 'Main Courses', imageUrl: images.find(i => i.id === 'burger_1')?.imageUrl!, imageHint: 'gourmet burger' },
      { id: 'm2', name: 'Pepperoni Pizza', description: 'Classic pizza with spicy pepperoni.', price: 15.50, category: 'Main Courses', imageUrl: images.find(i => i.id === 'pizza_1')?.imageUrl!, imageHint: 'pepperoni pizza' },
      { id: 'm3', name: 'Garden Salad', description: 'Fresh greens, tomatoes, and cucumbers.', price: 8.00, category: 'Appetizers', imageUrl: images.find(i => i.id === 'salad_1')?.imageUrl!, imageHint: 'fresh salad' },
      { id: 'm4', name: 'Spaghetti Bolognese', description: 'Rich meat sauce over pasta.', price: 14.00, category: 'Main Courses', imageUrl: images.find(i => i.id === 'pasta_1')?.imageUrl!, imageHint: 'spaghetti bolognese' },
      { id: 'm5', name: 'Chocolate Lava Cake', description: 'Warm cake with a gooey center.', price: 7.50, category: 'Desserts', imageUrl: images.find(i => i.id === 'dessert_1')?.imageUrl!, imageHint: 'chocolate cake' },
      { id: 'm6', name: 'Sunset Cocktail', description: 'A tropical mix of juices and rum.', price: 9.00, category: 'Drinks', imageUrl: images.find(i => i.id === 'drink_1')?.imageUrl!, imageHint: 'cocktail drink' },
    ],
  },
];

export const generateOrdersData = (restaurant: Restaurant = restaurantData[0]): Order[] => {
  const statuses: OrderStatus[] = ['new', 'in-progress', 'ready', 'completed'];
  const orders: Order[] = [];

  for (let i = 0; i < 8; i++) {
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let total = 0;
    for (let j = 0; j < numItems; j++) {
      const menuItem = restaurant.menu[Math.floor(Math.random() * restaurant.menu.length)];
      const quantity = Math.floor(Math.random() * 2) + 1;
      items.push({ menuItem, quantity });
      total += menuItem.price * quantity;
    }
    
    orders.push({
      id: `ORD${1001 + i}`,
      restaurantId: restaurant.id,
      items,
      total,
      status: statuses[i % statuses.length],
      timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 2), // within last 2 hours
    });
  }
  return orders.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const findRestaurantByCode = (code: string): Restaurant | undefined => {
  return restaurantData.find(r => r.code.toUpperCase() === code.toUpperCase());
};

export const findRestaurantByEmail = (email: string): Restaurant | undefined => {
    return restaurantData.find(r => r.email.toLowerCase() === email.toLowerCase());
};
