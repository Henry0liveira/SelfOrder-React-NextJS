
"use client";

import type { Order, OrderStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChefHat, CheckCircle, Loader2, User } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
    const getTimestamp = () => {
        if (!order.timestamp) return 'No time';
        if (order.timestamp instanceof Timestamp) {
            return order.timestamp.toDate().toLocaleTimeString();
        }
        // Fallback for cases where it might be a string or number from older data
        return new Date(order.timestamp).toLocaleTimeString();
    }


  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
            <CardTitle className="text-lg font-bold">Pedido #{order.id.substring(0, 6)}</CardTitle>
            <CardDescription className="flex items-center gap-2">
                <span>{getTimestamp()}</span>
                {order.customer?.name && (
                    <>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="flex items-center gap-1.5"><User className="h-4 w-4"/> {order.customer.name}</span>
                    </>
                )}
            </CardDescription>
        </div>
        <div className="text-right">
            <p className="text-2xl font-bold font-headline text-primary">${order.total.toFixed(2)}</p>
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="my-4" />
        <ul className="space-y-2 text-sm">
          {order.items.map((item, index) => (
            <li key={`${item.menuItemId}-${index}`} className="flex justify-between">
              <span>{item.quantity}x {item.name}</span>
              <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-2 justify-end">
          {order.status === 'new' && (
            <Button onClick={() => onStatusChange(order.id, 'in-progress')}>
              <Loader2 className="mr-2 h-4 w-4" /> Iniciar Preparo
            </Button>
          )}
          {order.status === 'in-progress' && (
            <Button onClick={() => onStatusChange(order.id, 'ready')} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
              <ChefHat className="mr-2 h-4 w-4" /> Marcar como Pronto
            </Button>
          )}
          {order.status === 'ready' && (
            <Button onClick={() => onStatusChange(order.id, 'completed')} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <CheckCircle className="mr-2 h-4 w-4" /> Concluir Pedido
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
