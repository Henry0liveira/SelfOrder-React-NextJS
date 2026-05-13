"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function StaffSettingsPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const ref = doc(firestore, 'restaurants', user.uid);
        const snap = await getDoc(ref);
        const data = snap.data() as any;
        if (data) {
          setName(data.name || '');
          setHours(data.hours || '');
          setLogoUrl(data.logoUrl || '');
          setBannerUrl(data.bannerUrl || '');
          setDeliveryEnabled(data.deliveryEnabled ?? true);
          setPickupEnabled(data.pickupEnabled ?? true);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, firestore]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return router.push('/staff/login');
    setLoading(true);
    try {
      const ref = doc(firestore, 'restaurants', user.uid);
      await updateDoc(ref, {
        name,
        hours,
        logoUrl,
        bannerUrl,
        deliveryEnabled,
        pickupEnabled,
      });
      toast({ title: 'Alterações salvas' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-secondary/30 p-6">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Estabelecimento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Nome do Estabelecimento</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <Label>Horário de Funcionamento</Label>
                <Textarea value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Ex: Seg-Sex 09:00-18:00\nSáb 09:00-14:00" />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Logo do Restaurante</Label>
                  <div className="mt-2 grid gap-3 sm:grid-cols-[120px,1fr] sm:items-center">
                    <div className="relative h-24 w-24 overflow-hidden rounded-xl border bg-muted mx-auto sm:mx-0">
                      {logoUrl ? (
                        <Image src={logoUrl} alt="Logo do restaurante" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground text-center px-2">
                          Sem logo
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setLogoUrl(await readFileAsDataUrl(file));
                          } catch {
                            toast({ title: 'Erro', description: 'Não foi possível carregar a logo.', variant: 'destructive' });
                          }
                        }}
                      />
                      <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Ou cole uma URL de imagem para a logo" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Header / Capa do Restaurante</Label>
                  <div className="mt-2 space-y-3">
                    <div className="relative h-36 w-full overflow-hidden rounded-xl border bg-muted">
                      {bannerUrl ? (
                        <Image src={bannerUrl} alt="Header do restaurante" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground text-center px-4">
                          Sem header
                        </div>
                      )}
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setBannerUrl(await readFileAsDataUrl(file));
                        } catch {
                          toast({ title: 'Erro', description: 'Não foi possível carregar o header.', variant: 'destructive' });
                        }
                      }}
                    />
                    <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="Ou cole uma URL de imagem para o header" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Delivery disponível</Label>
                  <p className="text-sm text-muted-foreground">Permite pedidos por entrega.</p>
                </div>
                <Switch checked={deliveryEnabled} onCheckedChange={(v) => setDeliveryEnabled(Boolean(v))} />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Retirada disponível</Label>
                  <p className="text-sm text-muted-foreground">Permite que clientes escolham retirar no local.</p>
                </div>
                <Switch checked={pickupEnabled} onCheckedChange={(v) => setPickupEnabled(Boolean(v))} />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Salvar Alterações</Button>
                <Button variant="ghost" asChild>
                  <Link href="/staff/dashboard">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
