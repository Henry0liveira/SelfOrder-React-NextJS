
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrCode, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { useFirestore } from '@/firebase';
import type { Restaurant } from '@/types';


export default function CustomerPortal() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleFindMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um código de restaurante.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);

    try {
        const restaurantsRef = collection(firestore, "restaurants");
        const q = query(restaurantsRef, where("code", "==", code.toUpperCase()), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const restaurantDoc = querySnapshot.docs[0];
            const restaurant = { id: restaurantDoc.id, ...restaurantDoc.data() } as Restaurant;
            router.push(`/${restaurant.code}`);
        } else {
            toast({
              title: 'Restaurante não encontrado',
              description: `Não conseguimos encontrar um cardápio para o código "${code}". Por favor, verifique o código e tente novamente.`,
              variant: 'destructive',
            });
            setIsLoading(false);
        }
    } catch (error) {
        console.error("Error finding restaurant:", error);
        toast({
            title: 'Erro de Busca',
            description: "Ocorreu um erro ao buscar o restaurante. Tente novamente.",
            variant: 'destructive',
        });
        setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleFindMenu} className="space-y-4">
      <div className="relative">
        <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Insira o Código do Restaurante"
          className="pl-10 text-lg h-12"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          aria-label="Restaurant Code"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? 'Buscando...' : 'Ver Cardápio'}
        {!isLoading && <ArrowRight className="ml-2" />}
      </Button>
    </form>
  );
}
