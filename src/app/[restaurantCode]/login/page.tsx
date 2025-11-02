
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, LogIn, User } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import type { Restaurant } from '@/types';
import Link from 'next/link';
import { useAuth, useCollectionQuery } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function CustomerLoginPage() {
  const params = useParams();
  const restaurantCode = params.restaurantCode as string;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  
  const {data: restaurants, loading} = useCollectionQuery<Restaurant>('restaurants', 'code', restaurantCode);
  const restaurant = restaurants?.[0];

  useEffect(() => {
    if (!loading && !restaurant) {
        router.push('/not-found');
    }
  }, [restaurant, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        toast({
            title: 'Login bem-sucedido!',
            description: `Bem-vindo de volta, ${user.displayName || user.email}!`,
        });
        
        router.push(`/${restaurantCode}`);
    } catch (error: any) {
        toast({
            title: 'Falha no Login',
            description: 'E-mail ou senha inválidos. Por favor, tente novamente.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center bg-primary rounded-full p-3 shadow-lg mx-auto mb-4">
                <User className="h-8 w-8 text-primary-foreground" />
            </div>
          <CardTitle className="text-3xl font-headline">Login do Cliente</CardTitle>
          <CardDescription>
            Faça login para continuar para <span className="font-semibold text-primary">{restaurant?.name || '...'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading || loading}>
              {isLoading ? 'Fazendo Login...' : 'Login'}
              {!isLoading && <LogIn className="ml-2 h-4 w-4" />}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
                Não tem uma conta?{' '}
                <Link href={`/${restaurantCode}/signup`} className="underline text-primary">
                    Cadastre-se
                </Link>
            </div>
           <Button variant="link" className="w-full mt-2" asChild>
            <Link href="/">
              Voltar para a Página Inicial
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
