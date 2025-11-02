
"use client";

import { useState, useEffect } from 'react';
import { ChefHat, ShoppingBasket, CheckCircle, LogOut, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Order, OrderStatus, Restaurant } from '@/types';
import { OrderCard } from '@/components/order-card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useCollectionQuery } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export default function StaffOrdersPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  
  // 1. Fetch restaurant document where ownerUid matches the current user's ID
  const { data: restaurants, loading: restaurantLoading } = useCollectionQuery<Restaurant>(
    user?.uid ? 'restaurants' : '',
    { field: 'ownerUid', operator: '==', value: user?.uid || '' }
  );
  const restaurant = restaurants?.[0];

  // 2. Fetch orders only when we have the restaurant's actual document ID
  const { data: orders, loading: ordersLoading } = useCollectionQuery<Order>(
    restaurant?.id ? 'orders' : '',
    { field: 'restaurantId', operator: '==', value: restaurant?.id || '' }
  );

  const loading = userLoading || restaurantLoading || ordersLoading;

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!orderId) return;
    const orderDocRef = doc(firestore, 'orders', orderId);
    try {
      await updateDoc(orderDocRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating order status: ", error);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/staff/login');
  };
  
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/staff/login');
    }
  }, [user, userLoading, router]);

  const renderOrderList = (status: OrderStatus) => {
    if (loading) {
      return (
        <div className="text-center text-muted-foreground py-16">
          <Loader2 className="w-12 h-12 animate-spin mx-auto" />
          <p>Carregando pedidos...</p>
        </div>
      );
    }
    
    if (!orders) {
        return (
             <div className="text-center text-muted-foreground py-16">
                <ShoppingBasket className="w-12 h-12 mx-auto mb-4" />
                <p>Nenhum pedido encontrado ainda.</p>
            </div>
        )
    }

    const filteredOrders = orders
        .filter(order => order.status === status)
        .sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis());
    
    if (filteredOrders.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-16">
            <div className="flex items-center justify-center mb-4">
              {status === 'new' && <ShoppingBasket className="w-12 h-12" />}
              {status === 'in-progress' && <Loader2 className="w-12 h-12 animate-spin" />}
              {status === 'ready' && <ChefHat className="w-12 h-12" />}
              {status === 'completed' && <CheckCircle className="w-12 h-12" />}
            </div>
            <p>Nenhum pedido na categoria '{status}' agora.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
        ))}
      </div>
    );
  };
  
  const getCount = (status: OrderStatus) => {
    if (loading || !orders) return 0;
    return orders.filter(o => o.status === status).length;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/staff/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
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
            <h1 className="text-3xl font-bold font-headline">Pedidos Recebidos</h1>
            <p className="text-muted-foreground">Gerencie e acompanhe os pedidos dos clientes em tempo real.</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1.5 rounded-none rounded-t-lg">
                <TabsTrigger value="new" className="py-2.5">
                  <ShoppingBasket className="mr-2 h-4 w-4" /> Novo ({getCount('new')})
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="py-2.5">
                  <Loader2 className="mr-2 h-4 w-4" /> Em Progresso ({getCount('in-progress')})
                </TabsTrigger>
                <TabsTrigger value="ready" className="py-2.5">
                  <ChefHat className="mr-2 h-4 w-4" /> Pronto ({getCount('ready')})
                </TabsTrigger>
                <TabsTrigger value="completed" className="py-2.5">
                  <CheckCircle className="mr-2 h-4 w-4" /> Concluído ({getCount('completed')})
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
