
"use client";

import { findRestaurantByCode } from '@/lib/mock-data';
import { notFound, useRouter, useParams } from 'next/navigation';
import MenuView from '@/components/menu-view';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Restaurant } from '@/types';


export default function MenuPage() {
  const params = useParams();
  const restaurantCode = params.restaurantCode as string;
  const [restaurant, setRestaurant] = useState<Restaurant | null | undefined>(undefined);
  
  useEffect(() => {
    const foundRestaurant = findRestaurantByCode(restaurantCode);
    setRestaurant(foundRestaurant);
  }, [restaurantCode]);

  if (restaurant === undefined) {
    // This state is handled by the parent layout now
    return null;
  }

  if (!restaurant) {
    notFound();
  }

  return (
    <MenuView restaurant={restaurant} />
  );
}
