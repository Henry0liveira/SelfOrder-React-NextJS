
'use client';

import { useUser, useCollectionQuery } from '@/firebase';
import { useParams, useRouter } from 'next/navigation';
import type { Order, Restaurant } from '@/types';
import { Loader2, ShoppingBasket } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from 'firebase/firestore';

const statusStyles: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
};

export default function CustomerOrdersPage() {
  const params = useParams();
  const restaurantCode = params.restaurantCode as string;
  const router = useRouter();

  const { user, loading: userLoading } = useUser();
  const { data: restaurants, loading: restaurantLoading } =
    useCollectionQuery<Restaurant>('restaurants', [{field: 'code', operator: '==', value: restaurantCode}]);
  const restaurant = restaurants?.[0];

  const { data: orders, loading: ordersLoading } = useCollectionQuery<Order>(
    restaurant?.id && user?.uid ? 'orders' : '',
    [
      { field: 'customerUid', operator: '==', value: user?.uid },
      { field: 'restaurantId', operator: '==', value: restaurant?.id },
    ]
  );

  const loading = userLoading || restaurantLoading || ordersLoading;

  const sortedOrders = orders?.sort(
    (a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()
  );

  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-2">Meus Pedidos</h1>
      <p className="text-muted-foreground mb-8">
        Acompanhe o histórico de seus pedidos em {restaurant?.name || '...'}.
      </p>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {!loading && (!sortedOrders || sortedOrders.length === 0) && (
        <Card className="text-center py-16">
          <CardHeader>
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
              <ShoppingBasket className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4">Nenhum pedido encontrado</CardTitle>
            <CardDescription>
              Você ainda não fez nenhum pedido neste restaurante.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!loading && sortedOrders && sortedOrders.length > 0 && (
        <div className="space-y-6">
          {sortedOrders.map((order) => (
            <Link
              href={`/${restaurantCode}/order/${order.id}`}
              key={order.id}
              className="block"
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Pedido #{order.id.substring(0, 6)}</CardTitle>
                      <CardDescription>
                        {order.timestamp instanceof Timestamp
                          ? order.timestamp.toDate().toLocaleString()
                          : 'Data indisponível'}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`capitalize ${
                        statusStyles[order.status] || 'bg-gray-100'
                      }`}
                    >
                      {order.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} item(ns)
                    </p>
                    <p className="text-lg font-bold text-primary">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
