
"use client";

import type { Order, OrderStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChefHat, CheckCircle, Loader2, User, Star } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

function Rating({ rating, className }: { rating: number, className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
}

const getTimestampLabel = (timestamp: Order['timestamp']) => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return 'No time';
};

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
            <CardTitle className="text-lg font-bold">Pedido #{order.id.substring(0, 6)}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
                <span>{getTimestampLabel(order.timestamp)}</span>
                {order.customer?.name && (
                    <>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="flex items-center gap-1.5"><User className="h-3 w-3"/> {order.customer.name}</span>
                    </>
                )}
            </CardDescription>
        </div>
        <div className="text-right">
            <p className="text-2xl font-bold font-headline text-primary">${order.total.toFixed(2)}</p>
             {order.rating && (
                <Rating rating={order.rating} className="justify-end mt-1" />
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="my-4" />
        <ul className="space-y-2 text-sm">
          {order.items.map((item, index) => (
            <li key={`${item.menuItemId}-${index}`} className="space-y-1 rounded-xl border border-border/60 p-3">
              <div className="flex justify-between gap-3">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
              {(item.selectedSize || item.addons?.length || item.observation) && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  {item.selectedSize && <p>Tamanho: {item.selectedSize.name}</p>}
                  {item.addons && item.addons.length > 0 && <p>Adicionais: {item.addons.map((addon) => addon.name).join(', ')}</p>}
                  {item.observation && <p>Obs.: {item.observation}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>

        {order.customerNote && (
          <div className="mt-4 rounded-xl bg-muted/60 p-3 text-sm">
            <p className="font-medium text-foreground">Observação do pedido</p>
            <p className="text-muted-foreground">{order.customerNote}</p>
          </div>
        )}

        {order.review && (
            <div className="mt-4">
                <Separator />
                <blockquote className="text-sm italic text-muted-foreground border-l-2 pl-3 mt-3">
                    "{order.review}"
                </blockquote>
            </div>
        )}
        
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
          {order.status === 'completed' && !order.rating && (
            <p className="text-sm text-muted-foreground italic">Aguardando avaliação do cliente.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
