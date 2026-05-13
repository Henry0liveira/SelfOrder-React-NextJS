
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, ShoppingBasket, ChefHat, CheckCircle2, Star } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusConfig: Record<OrderStatus, { text: string; progress: number; icon: React.ReactNode }> = {
    'new': { text: 'Pedido recebido', progress: 25, icon: <ShoppingBasket className="h-8 w-8" /> },
    'in-progress': { text: 'Em preparo', progress: 50, icon: <Loader2 className="h-8 w-8 animate-spin" /> },
    'ready': { text: 'Pronto para retirada', progress: 75, icon: <ChefHat className="h-8 w-8" /> },
    'completed': { text: 'Pedido finalizado', progress: 100, icon: <CheckCircle2 className="h-8 w-8 text-green-600" /> },
};

function Rating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-5 w-5',
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
}

function RatingForm({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Avaliação incompleta", description: "Por favor, selecione uma nota de 1 a 5 estrelas.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { rating, review });
      toast({ title: "Avaliação enviada", description: "Obrigado pelo seu feedback!" });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({ title: "Erro", description: "Não foi possível enviar sua avaliação.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <Separator />
      <h3 className="font-semibold text-center">Avalie sua experiência</h3>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}>
            <Star
              className={cn(
                'h-8 w-8 transition-colors',
                star <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Deixe um comentário (opcional)..."
        value={review}
        onChange={(e) => setReview(e.target.value)}
        disabled={isSubmitting}
      />
      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Enviar Avaliação'}
      </Button>
    </div>
  );
}


export default function OrderStatusPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const restaurantCode = params.restaurantCode as string;

  const { data: order, loading } = useDoc<Order>('orders', orderId);

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
                    <Link href={`/${restaurantCode}`}>Voltar ao Cardápio</Link>
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
            Acompanhe o status do seu pedido #{order.id.substring(0,6)}...
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
                        <li key={`${item.menuItemId}-${index}`} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <Separator className="my-3" />
                 <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                </div>
            </div>

            {order.status === 'completed' && order.rating && (
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-semibold text-center">Sua Avaliação</h3>
                <div className="flex justify-center">
                  <Rating rating={order.rating} />
                </div>
                {order.review && (
                   <blockquote className="text-center text-sm text-muted-foreground italic border-l-2 pl-4">
                    "{order.review}"
                  </blockquote>
                )}
              </div>
            )}

        </CardContent>
        <CardFooter className="flex-col gap-4">
            {order.status === 'completed' && !order.rating && (
                <RatingForm orderId={order.id} />
            )}
             {order.status === 'completed' && order.rating && (
                <p className="text-center text-green-600 font-semibold">Obrigado por avaliar!</p>
            )}

            <Button asChild size="lg" className="w-full" variant="outline">
                <Link href={`/${restaurantCode}`}>Voltar ao Cardápio</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
