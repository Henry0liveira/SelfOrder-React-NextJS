
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ArrowLeft, PlusCircle, UtensilsCrossed } from 'lucide-react';
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
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';

export default function CreateRestaurantPage() {
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  // Get hooks here, but use them inside the handler
  const auth = useAuth();
  const firestore = useFirestore();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!restaurantName || !email || !password) {
        toast({
            title: "Erro de Validação",
            description: "Por favor, preencha todos os campos.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const newRestaurantCode = `${restaurantName.substring(0, 4).toUpperCase().replace(/\s/g, '')}${Math.floor(100 + Math.random() * 900)}`;

      // Create a restaurant document in Firestore, using the user's UID as the document ID
      const restaurantDocRef = doc(firestore, 'restaurants', user.uid);
      await setDoc(restaurantDocRef, {
        name: restaurantName,
        code: newRestaurantCode,
        ownerUid: user.uid,
      });

       // Create a user profile document
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, {
        name: restaurantName, // Restaurant owner's name is the restaurant name by default
        email: user.email,
      });

      toast({
        title: 'Restaurante Criado!',
        description: `O restaurante "${restaurantName}" está pronto. Faça o login.`,
      });
      
      router.push('/staff/login');

    } catch (error: any) {
      console.error("Erro ao criar restaurante:", error);
      let description = 'Ocorreu um erro desconhecido.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este endereço de e-mail já está em uso por outra conta.';
      } else if (error.message) {
        description = error.message;
      }
      toast({
        title: 'Erro ao Criar Conta',
        description: description,
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
            <Link href="/" className="inline-block mx-auto mb-4">
                <div className="inline-flex items-center justify-center bg-primary rounded-full p-3 shadow-lg">
                    <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
                </div>
            </Link>
          <CardTitle className="text-3xl font-headline">Crie um Novo Restaurante</CardTitle>
          <CardDescription>Preencha os detalhes para começar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Nome do Restaurante</Label>
              <Input
                id="restaurantName"
                type="text"
                placeholder="Ex: The Tasty Spoon"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail de Login</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: staff@yourrestaurant.com"
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
                placeholder="Crie uma senha segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Restaurante'}
              {!isLoading && <PlusCircle className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <Button variant="link" className="w-full mt-4" asChild>
            <Link href="/staff/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
