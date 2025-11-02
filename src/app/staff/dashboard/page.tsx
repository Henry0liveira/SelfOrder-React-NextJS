
"use client";

import { useEffect } from 'react';
import { LogOut, UtensilsCrossed, ClipboardList, BookOpen, QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { Restaurant } from '@/types';
import { signOut } from 'firebase/auth';


export default function StaffDashboardPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  
  const { data: restaurantInfo, loading: restaurantLoading } = useDoc<Restaurant>(
    'restaurants',
    user?.uid
  );

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/staff/login');
    }
  }, [user, userLoading, router]);

  if (userLoading || restaurantLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary/30">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/staff/orders" className="block transform hover:scale-105 transition-transform duration-300">
                <Card className="h-full shadow-xl text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <ClipboardList className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-headline">Ver Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Acompanhe os pedidos dos clientes em tempo real.</CardDescription>
                    </CardContent>
                </Card>
            </Link>
            
            <Link href="/staff/menu" className="block transform hover:scale-105 transition-transform duration-300">
                 <Card className="h-full shadow-xl text-center">
                    <CardHeader>
                         <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <BookOpen className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-headline">Gerenciar Cardápio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Adicione, edite ou remova itens do seu cardápio.</CardDescription>
                    </CardContent>
                </Card>
            </Link>
        </div>
      </main>
    </div>
  );
}
