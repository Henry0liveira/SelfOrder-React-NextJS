
"use client";

import { notFound, useParams } from 'next/navigation';
import MenuView from '@/components/menu-view';
import { Loader2 } from 'lucide-react';
import type { Restaurant, MenuItem } from '@/types';
import { useCollection, useCollectionQuery } from '@/firebase';


export default function MenuPage() {
  const params = useParams();
  const restaurantCode = params.restaurantCode as string;
  
  const {data: restaurants, loading: restaurantLoading} = useCollectionQuery<Restaurant>('restaurants', [{field: 'code', operator: '==', value: restaurantCode}]);
  const restaurant = restaurants?.[0];

  const {data: menuItems, loading: menuLoading} = useCollection<MenuItem>(
    restaurant ? `restaurants/${restaurant.id}/menu` : ''
  );
  
  const loading = restaurantLoading || menuLoading;

  if (loading) {
    return null; // The parent layout will show a global loader
  }

  if (!restaurant) {
    notFound();
  }

  return (
    <MenuView restaurant={restaurant} menuItems={menuItems || []} />
  );
}
