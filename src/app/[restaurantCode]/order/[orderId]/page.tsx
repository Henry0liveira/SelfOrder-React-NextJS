"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, ShoppingBasket, ChefHat, CheckCircle2 } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';

type Props = {
  params: {
    restaurantCode: string;
    orderId: string;
  };
};

const statusConfig: Record<OrderStatus, { text: string; progress: number; icon: React.ReactNode }> = {
    'new': { text: 'Pedido recebido', progress: 25, icon: <ShoppingBasket className="h-8 w-8" /> },
    'in-progress': { text: 'Em preparo', progress: 50, icon: <Loader2 className="h-8 w-8 animate-spin" /> },
    'ready': { text: 'Pronto para retirada', progress: 75, icon: <ChefHat className="h-8 w-8" /> },
    'completed': { text: 'Pedido finalizado', progress: 100, icon: <CheckCircle2 className="h-8 w-8 text-green-600" /> },
};


export default function OrderStatusPage({ params }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = () => {
      const allOrders: Order[] = JSON.parse(localStorage.getItem('orders') || '[]').map((o: any) => ({...o, timestamp: new Date(o.timestamp)}));
      const foundOrder = allOrders.find(o => o.id === params.orderId);
      if (foundOrder) {
        setOrder(foundOrder);
      }
      setLoading(false);
    };

    fetchOrder();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchOrder, 2000);
    return () => clearInterval(interval);
  }, [params.orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/30 p-4">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <CardTitle>Pedido não encontrado</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Não conseguimos encontrar os detalhes do seu pedido.</p>
                <Button asChild className="mt-4">
                    <Link href={`/${params.restaurantCode}`}>Voltar ao Cardápio</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  const currentStatus = statusConfig[order.status];

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4`}>
            {currentStatus.icon}
          </div>
          <CardTitle className="text-3xl font-bold font-headline">
            {currentStatus.text}
          </CardTitle>
          <CardDescription className="text-lg">
            Acompanhe o status do seu pedido #{order.id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-3">
                <Progress value={currentStatus.progress} className="w-full h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Recebido</span>
                    <span>Em Preparo</span>
                    <span>Pronto</span>
                    <span>Finalizado</span>
                </div>
            </div>

            <Separator />
            
            <div>
                <h3 className="font-semibold mb-2">Resumo do Pedido</h3>
                <ul className="space-y-2 text-sm">
                    {order.items.map((item, index) => (
                        <li key={`${item.menuItem.id}-${index}`} className="flex justify-between">
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span className="font-mono">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <Separator className="my-3" />
                 <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                </div>
            </div>

        </CardContent>
        <CardFooter className="flex-col gap-4">
            {order.status === 'completed' && (
                <p className="text-center text-green-600 font-semibold">Seu pedido foi concluído. Bom apetite!</p>
            )}
            <Button asChild size="lg" className="w-full" variant="outline">
                <Link href={`/${params.restaurantCode}`}>Voltar ao Cardápio</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
