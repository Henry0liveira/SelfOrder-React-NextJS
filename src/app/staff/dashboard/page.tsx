"use client";

import { useEffect, useState } from 'react';
import { LogOut, UtensilsCrossed, ClipboardList, BookOpen, QrCode, Loader2, Bot, AreaChart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth, useCollection, useFirestore } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { Restaurant, MenuItem, Order, StockItem } from '@/types';
import { signOut } from 'firebase/auth';
import { collection, writeBatch, serverTimestamp, doc } from 'firebase/firestore';


// Define a mock customer type locally as it's only used here
type MockCustomer = {
    name: string;
    email: string;
};

export default function StaffDashboardPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: restaurantInfo, loading: restaurantLoading } = useDoc<Restaurant>(
    'restaurants',
    user?.uid || ''
  );

  const { data: menuItems, loading: menuLoading } = useCollection<MenuItem>(
    user?.uid ? `restaurants/${user.uid}/menu` : ''
  );

  const { data: stockItems } = useCollection<StockItem>(
    user?.uid ? `restaurants/${user.uid}/stock` : ''
  );

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/staff/login');
    }
  }, [user, userLoading, router]);
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/staff/login');
  };

  const handleCopyToClipboard = () => {
    if (restaurantInfo?.code) {
      navigator.clipboard.writeText(restaurantInfo.code);
      toast({
        title: "Código Copiado!",
        description: `O código do restaurante "${restaurantInfo.code}" foi copiado.`,
      });
    }
  };

  const generateMockOrders = async () => {
    if (!user || !restaurantInfo || !menuItems || menuItems.length === 0) {
      toast({
        title: "Não é possível gerar dados",
        description: "Certifique-se de que o restaurante está carregado e tem itens de menu.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);

    const mockCustomers: MockCustomer[] = [
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" },
      { name: "Charlie", email: "charlie@example.com" },
      { name: "Diana", email: "diana@example.com" },
      { name: "Ethan", email: "ethan@example.com" },
    ];
    
    const numberOfOrders = Math.floor(Math.random() * 5) + 1;
    const batch = writeBatch(firestore);
    const ordersCollectionRef = collection(firestore, 'orders');

    for (let i = 0; i < numberOfOrders; i++) {
        const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
        const numItemsInOrder = Math.floor(Math.random() * 2) + 3;
        const orderItems = [];
        let orderTotal = 0;

        for (let j = 0; j < numItemsInOrder; j++) {
            const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
            const quantity = 1;
            orderItems.push({
                menuItemId: menuItem.id,
                name: menuItem.name,
                quantity: quantity,
                price: menuItem.price,
                category: menuItem.category || 'Outros',
            });
            orderTotal += menuItem.price * quantity;
        }

        const newOrder: Omit<Order, 'id'> = {
            restaurantId: restaurantInfo.id,
            customerUid: `mock_${Date.now()}_${i}`,
            customer: { name: customer.name, email: customer.email },
            items: orderItems,
            total: orderTotal,
            status: 'completed',
            timestamp: serverTimestamp(),
            rating: Math.floor(Math.random() * 3) + 3,
            review: "Ótima experiência! Comida deliciosa."
        };
        
        const newOrderRef = doc(ordersCollectionRef);
        batch.set(newOrderRef, newOrder);
    }

    try {
        await batch.commit();
        toast({
            title: "Dados Gerados!",
            description: `${numberOfOrders} pedidos de teste foram adicionados com sucesso.`,
        });
    } catch (error) {
        console.error("Erro ao gerar dados de teste:", error);
        toast({
            title: "Erro",
            description: "Não foi possível gerar os dados de teste.",
            variant: "destructive"
        });
    } finally {
        setIsGenerating(false);
    }
  };

  // Low stock alert count
  const lowStockCount = stockItems?.filter(s => s.minStock !== undefined && s.currentStock <= s.minStock).length || 0;

  const loading = userLoading || restaurantLoading;
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary/30">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!restaurantInfo) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/30 p-4">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Restaurante não encontrado</CardTitle>
                    <CardDescription>Não encontramos um restaurante associado à sua conta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="mb-4">
                      <Link href="/staff/create-restaurant">Criar um Restaurante</Link>
                    </Button>
                    <Button onClick={handleLogout} variant="secondary">Fazer Login com Outra Conta</Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <UtensilsCrossed className="h-6 w-6 text-primary" />
                    <span className="font-headline">{restaurantInfo.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold font-headline">Painel da Equipe</h1>
            <p className="text-muted-foreground text-lg">Selecione uma opção para começar</p>
        </div>

        <Card className="max-w-4xl mx-auto mb-8 text-center shadow-lg">
          <CardHeader>
            <CardTitle>Seu Código de Restaurante</CardTitle>
            <CardDescription>
              Os clientes usarão este código para acessar seu cardápio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center gap-4">
              <Badge variant="secondary" className="text-2xl font-bold font-mono tracking-widest p-4 rounded-lg">
                {restaurantInfo.code}
              </Badge>
              <Button onClick={handleCopyToClipboard} variant="outline" size="sm">
                <QrCode className="mr-2 h-4 w-4" /> Copiar Código
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Link href="/staff/orders" className="block transform hover:scale-105 transition-transform duration-300">
                <Card className="h-full shadow-xl text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <ClipboardList className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-headline">Ver Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Acompanhe pedidos em tempo real.</CardDescription>
                    </CardContent>
                </Card>
            </Link>
            
            <Link href="/staff/menu" className="block transform hover:scale-105 transition-transform duration-300">
                 <Card className="h-full shadow-xl text-center">
                    <CardHeader>
                         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <BookOpen className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-headline">Gerenciar Cardápio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Adicione, edite ou remova itens e ingredientes.</CardDescription>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/staff/stock" className="block transform hover:scale-105 transition-transform duration-300">
                 <Card className="h-full shadow-xl text-center relative overflow-hidden">
                    {lowStockCount > 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive" className="text-xs">{lowStockCount} baixo</Badge>
                      </div>
                    )}
                    <CardHeader>
                         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <Package className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-headline">Estoque</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Controle ingredientes e consumo automático.</CardDescription>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/staff/kpis" className="block transform hover:scale-105 transition-transform duration-300">
                 <Card className="h-full shadow-xl text-center">
                    <CardHeader>
                         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <AreaChart className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-headline">Dashboard & KPIs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Gráficos, faturamento e indicadores de desempenho.</CardDescription>
                    </CardContent>
                </Card>
            </Link>
        </div>
        
        <div className="max-w-5xl mx-auto mt-6">
            <Card className="transform hover:scale-[1.02] transition-transform duration-300 shadow-xl text-center">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                       <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-headline">Gerador de Dados de Teste</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="mb-4">
                      Cria pedidos concluídos aleatoriamente para popular os gráficos de KPIs.
                    </CardDescription>
                    <Button onClick={generateMockOrders} disabled={isGenerating || menuLoading}>
                      {isGenerating ? <Loader2 className="animate-spin mr-2"/> :  <Bot className="mr-2"/>}
                      {isGenerating ? 'Gerando...' : 'Gerar Dados'}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
