"use client";

import { useState, useEffect } from 'react';
import { ChefHat, ShoppingBasket, CheckCircle, UtensilsCrossed, LogOut, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateOrdersData } from '@/lib/mock-data';
import type { Order, OrderStatus } from '@/types';
import { OrderCard } from '@/components/order-card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Ensure this code runs only on the client
    setIsClient(true);
    
    // In a real app, this would be a real-time subscription.
    // We'll use localStorage for this demo and poll for changes.
    const loadOrders = () => {
      const loggedInRestaurant = localStorage.getItem('loggedInRestaurant');
      if (!loggedInRestaurant) {
          router.push('/staff/login');
          return;
      }
      const restaurantId = JSON.parse(loggedInRestaurant).id;

      const storedOrders = localStorage.getItem('orders');
      if (storedOrders) {
        const parsedOrders: Order[] = JSON.parse(storedOrders).map((o: any) => ({
          ...o,
          timestamp: new Date(o.timestamp), // Ensure timestamp is a Date object
        }));
        // Filter orders for the logged-in restaurant
        setOrders(parsedOrders.filter(o => o.restaurantId === restaurantId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } else {
        // If no orders in localStorage, we can assume there are none for this restaurant yet
        setOrders([]);
      }
    }
    
    loadOrders();

    const interval = setInterval(loadOrders, 2000); // Check for new orders every 2 seconds
    return () => clearInterval(interval);

  }, [router]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const allOrders: Order[] = JSON.parse(localStorage.getItem('orders') || '[]').map((o:any) => ({...o, timestamp: new Date(o.timestamp)}));
    const updatedAllOrders = allOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    
    localStorage.setItem('orders', JSON.stringify(updatedAllOrders));
    
    // Update local state to reflect change immediately
    const loggedInRestaurantId = JSON.parse(localStorage.getItem('loggedInRestaurant')!).id;
    setOrders(updatedAllOrders.filter(o => o.restaurantId === loggedInRestaurantId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };
  
  const handleLogout = () => {
    localStorage.removeItem('loggedInRestaurant');
    router.push('/staff/login');
  };

  const renderOrderList = (status: OrderStatus) => {
    if (!isClient) {
      return (
        <div className="text-center text-muted-foreground py-16">
          <Loader2 className="w-12 h-12 animate-spin mx-auto" />
          <p>Loading orders...</p>
        </div>
      )
    }

    const filteredOrders = orders.filter(order => order.status === status);
    
    if (filteredOrders.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-16">
            <div className="flex items-center justify-center mb-4">
              {status === 'new' && <ShoppingBasket className="w-12 h-12" />}
              {status === 'in-progress' && <Loader2 className="w-12 h-12 animate-spin" />}
              {status === 'ready' && <ChefHat className="w-12 h-12" />}
              {status === 'completed' && <CheckCircle className="w-12 h-12" />}
            </div>
            <p>No {status} orders right now.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredOrders.map((order, index) => (
          <OrderCard key={`${order.id}-${index}`} order={order} onStatusChange={handleStatusChange} />
        ))}
      </div>
    );
  };
  
  const getCount = (status: OrderStatus) => {
    if (!isClient) return 0;
    return orders.filter(o => o.status === status).length;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/staff/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
            <h1 className="text-3xl font-bold font-headline">Incoming Orders</h1>
            <p className="text-muted-foreground">Manage and track customer orders in real-time.</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1.5 rounded-none rounded-t-lg">
                <TabsTrigger value="new" className="py-2.5">
                  <ShoppingBasket className="mr-2 h-4 w-4" /> New ({getCount('new')})
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="py-2.5">
                  <Loader2 className="mr-2 h-4 w-4" /> In Progress ({getCount('in-progress')})
                </TabsTrigger>
                <TabsTrigger value="ready" className="py-2.5">
                  <ChefHat className="mr-2 h-4 w-4" /> Ready ({getCount('ready')})
                </TabsTrigger>
                <TabsTrigger value="completed" className="py-2.5">
                  <CheckCircle className="mr-2 h-4 w-4" /> Completed ({getCount('completed')})
                </TabsTrigger>
              </TabsList>

              <div className="p-4 sm:p-6">
                <TabsContent value="new">{renderOrderList('new')}</TabsContent>
                <TabsContent value="in-progress">{renderOrderList('in-progress')}</TabsContent>
                <TabsContent value="ready">{renderOrderList('ready')}</TabsContent>
                <TabsContent value="completed">{renderOrderList('completed')}</TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
