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

function hexToHslTokens(hex: string) {
  const parsed = hex.replace('#','');
  const bigint = parseInt(parsed, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const rPct = r / 255;
  const gPct = g / 255;
  const bPct = b / 255;

  const max = Math.max(rPct, gPct, bPct);
  const min = Math.min(rPct, gPct, bPct);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rPct:
        h = (gPct - bPct) / d + (gPct < bPct ? 6 : 0);
        break;
      case gPct:
        h = (bPct - rPct) / d + 2;
        break;
      case bPct:
        h = (rPct - gPct) / d + 4;
        break;
    }
    h = h * 60;
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function tokensToHex(token?: string) {
  if (!token) return '#ff7f50';
  const parts = token.split(' ').map(p => p.replace('%',''));
  const h = parseFloat(parts[0]) || 16;
  const s = (parseFloat(parts[1]) || 100) / 100;
  const l = (parseFloat(parts[2]) || 65) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c/2;
  let r=0,g=0,b=0;
  if (0 <= h && h < 60) { r=c; g=x; b=0; }
  else if (60 <= h && h < 120) { r=x; g=c; b=0; }
  else if (120 <= h && h < 180) { r=0; g=c; b=x; }
  else if (180 <= h && h < 240) { r=0; g=x; b=c; }
  else if (240 <= h && h < 300) { r=x; g=0; b=c; }
  else { r=c; g=0; b=x; }

  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return `#${((1<<24) + (R<<16) + (G<<8) + B).toString(16).slice(1)}`;
}

export default function StaffSettingsPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [primary, setPrimary] = useState('#ff7f50');
  const [secondary, setSecondary] = useState('#ffe5b4');
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
          setPrimary(tokensToHex(data.primary));
          setSecondary(tokensToHex(data.secondary));
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
        primary: hexToHslTokens(primary),
        secondary: hexToHslTokens(secondary),
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

              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <Label>Cor Primária</Label>
                  <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="w-full h-10 rounded-md" />
                </div>
                <div>
                  <Label>Cor Secundária</Label>
                  <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="w-full h-10 rounded-md" />
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
