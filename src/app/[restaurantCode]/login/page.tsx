
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, UtensilsCrossed, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { Restaurant } from '@/types';
import { findRestaurantByCode } from '@/lib/mock-data';
import Link from 'next/link';


export default function CustomerLoginPage() {
  const params = useParams();
  const restaurantCode = params.restaurantCode as string;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [allowPromotions, setAllowPromotions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (restaurantCode) {
        const foundRestaurant = findRestaurantByCode(restaurantCode);
        if (foundRestaurant) {
            setRestaurant(foundRestaurant);
        } else {
            router.push('/not-found');
        }
    }
  }, [restaurantCode, router]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, preencha seu e-mail para continuar.',
        variant: 'destructive',
      });
      return;
    }
     if (!name) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, preencha seu nome para continuar.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    // Simulate saving user data
    setTimeout(() => {
      const customerData = { name, email, phone, allowPromotions };
      localStorage.setItem(`customerData-${restaurantCode}`, JSON.stringify(customerData));
      
      toast({
        title: 'Bem-vindo(a)!',
        description: `Olá ${name}, estamos te redirecionando para o cardápio.`,
      });
      
      router.push(`/${restaurantCode}`);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center bg-primary rounded-full p-3 shadow-lg mx-auto mb-4">
                <User className="h-8 w-8 text-primary-foreground" />
            </div>
          <CardTitle className="text-3xl font-headline">Identifique-se</CardTitle>
          <CardDescription>
            Para continuar para o cardápio de <span className="font-semibold text-primary">{restaurant?.name || '...'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleContinue} className="space-y-6">
             <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (Opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 90000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="promotions" checked={allowPromotions} onCheckedChange={(checked) => setAllowPromotions(checked as boolean)} />
                <Label htmlFor="promotions" className="text-sm font-normal text-muted-foreground">
                    Aceito receber promoções por e-mail.
                </Label>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Ver Cardápio'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
           <Button variant="link" className="w-full mt-4" asChild>
            <Link href="/">
              Voltar
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
