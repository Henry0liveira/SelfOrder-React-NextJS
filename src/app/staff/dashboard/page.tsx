"use client";

import { useState } from 'react';
import { ChefHat, ShoppingBasket, CheckCircle, UtensilsCrossed, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ordersData } from '@/lib/mock-data';
import type { Order, OrderStatus } from '@/types';
import { OrderCard } from '@/components/order-card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StaffDashboardPage() {
  const [orders, setOrders] = useState<Order[]>(ordersData);
  const router = useRouter();

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };
  
  const handleLogout = () => {
    router.push('/');
  };

  const renderOrderList = (status: OrderStatus) => {
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
        {filteredOrders.map(order => (
          <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
        ))}
      </div>
    );
  };
  
  const getCount = (status: OrderStatus) => orders.filter(o => o.status === status).length;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                    <UtensilsCrossed className="h-6 w-6 text-primary" />
                    <span className="font-headline">MenuQR Dashboard</span>
                </Link>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> In Progress ({getCount('in-progress')})
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
