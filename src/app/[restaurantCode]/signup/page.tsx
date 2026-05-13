
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, UserPlus } from 'lucide-react';
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
import { useAuth, useCollectionQuery, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';


export default function CustomerSignUpPage() {
  const params = useParams();
  const restaurantCode = params.restaurantCode as string;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const {data: restaurants, loading} = useCollectionQuery<Restaurant>('restaurants', [{field: 'code', operator: '==', value: restaurantCode}]);
  const restaurant = restaurants?.[0];

  useEffect(() => {
    if (!loading && !restaurant) {
        router.push('/not-found');
    }
  }, [restaurant, loading, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast({
        title: 'Informação faltando',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update user profile in Firebase Auth
        await updateProfile(user, { displayName: name });
        
        // Create user profile in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            name: name,
            email: email,
            phone: phone,
        });

        toast({
            title: 'Conta Criada!',
            description: `Bem-vindo, ${name}! Redirecionando você para o cardápio.`,
        });
        
        router.push(`/${restaurantCode}`);

    } catch (error: any) {
        console.error("Error creating customer account:", error);
        let description = 'Ocorreu um erro desconhecido.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'Este e-mail já está sendo usado por outra conta.';
        } else if (error.message) {
            description = error.message;
        }
        toast({
            title: "Erro ao Criar Conta",
            description,
            variant: "destructive"
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
                <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
          <CardTitle className="text-3xl font-headline">Crie sua Conta</CardTitle>
          <CardDescription>
            para pedir de <span className="font-semibold text-primary">{restaurant?.name || '...'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-6">
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
                placeholder="Crie uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <Button type="submit" className="w-full" size="lg" disabled={isLoading || loading}>
              {isLoading ? 'Criando Conta...' : 'Cadastrar e Ver Cardápio'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
                Já tem uma conta?{' '}
                <Link href={`/${restaurantCode}/login`} className="underline text-primary">
                    Faça Login
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
