
"use client";

import { useMemo } from 'react';
import { useUser, useCollectionQuery, useDoc } from '@/firebase';
import type { Order, Restaurant } from '@/types';
import { Loader2, ArrowLeft, Download, BarChart, PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart as RechartsBarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

// Helper function to format date
const formatDate = (date: Date) => format(date, 'dd/MM');

export default function KpiPage() {
  const { user, loading: userLoading } = useUser();
  const { data: restaurant, loading: restaurantLoading } = useDoc<Restaurant>('restaurants', user?.uid || '');
  
  const { data: orders, loading: ordersLoading } = useCollectionQuery<Order>(
    restaurant?.id ? 'orders' : '',
    [{ field: 'restaurantId', operator: '==', value: restaurant?.id || '' }, { field: 'status', operator: '==', value: 'completed' }]
  );

  const loading = userLoading || restaurantLoading || ordersLoading;

  const { dailyRevenue, topSellingItems } = useMemo(() => {
    if (!orders || orders.length === 0) {
      return { dailyRevenue: [], topSellingItems: [] };
    }

    // Process daily revenue
    const revenueMap = new Map<string, number>();
    orders.forEach(order => {
        if (order.timestamp instanceof Timestamp) {
            const dateStr = formatDate(order.timestamp.toDate());
            const currentRevenue = revenueMap.get(dateStr) || 0;
            revenueMap.set(dateStr, currentRevenue + order.total);
        }
    });
    const sortedRevenue = Array.from(revenueMap.entries())
      .map(([date, total]) => ({ date, total: parseFloat(total.toFixed(2)) }))
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());

    // Process top selling items
    const itemMap = new Map<string, { name: string; quantity: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const existingItem = itemMap.get(item.menuItemId);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          itemMap.set(item.menuItemId, { name: item.name, quantity: item.quantity });
        }
      });
    });
    const sortedItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return { dailyRevenue: sortedRevenue, topSellingItems: sortedItems };
  }, [orders]);
  
  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Daily Revenue sheet
    const ws1 = XLSX.utils.json_to_sheet(dailyRevenue, {header: ["date", "total"]});
    XLSX.utils.sheet_add_aoa(ws1, [["Data", "Faturamento Total"]], {origin: "A1"});
    XLSX.utils.book_append_sheet(wb, ws1, 'Faturamento Diario');
    
    // Top Selling Items sheet
    const ws2 = XLSX.utils.json_to_sheet(topSellingItems, {header: ["name", "quantity"]});
    XLSX.utils.sheet_add_aoa(ws2, [["Item", "Quantidade Vendida"]], {origin: "A1"});
    XLSX.utils.book_append_sheet(wb, ws2, 'Itens Mais Vendidos');
    
    XLSX.writeFile(wb, 'relatorio_kpis.xlsx');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary/30">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/30 p-4">
            <Card className="text-center">
                <CardHeader><CardTitle>Erro</CardTitle></CardHeader>
                <CardContent>
                    <p>Informações do restaurante não encontradas.</p>
                     <Button asChild className="mt-4"><Link href="/staff/dashboard">Voltar</Link></Button>
                </CardContent>
            </Card>
        </div>
      )
  }

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  return (
    <div className="min-h-screen bg-secondary/30">
        <header className="bg-card border-b sticky top-0 z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                 <Button variant="ghost" size="sm" asChild>
                    <Link href="/staff/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
                    </Link>
                </Button>
                <h1 className="text-xl font-bold font-headline">KPIs de Desempenho</h1>
                <Button onClick={handleExport} size="sm" disabled={!orders || orders.length === 0}>
                    <Download className="mr-2 h-4 w-4"/>
                    Exportar
                </Button>
            </div>
        </header>

        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            {(!orders || orders.length === 0) ? (
                 <Card className="text-center py-16">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                            <BarChart className="h-12 w-12 text-primary" />
                        </div>
                        <CardTitle className="mt-4">Nenhum dado para exibir</CardTitle>
                        <CardDescription>
                            Não há pedidos concluídos para gerar os gráficos. <br/>
                            Use o "Gerador de Dados de Teste" no painel para popular os dados.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart className="h-6 w-6"/> Faturamento Diário</CardTitle>
                            <CardDescription>Total de vendas de pedidos concluídos por dia.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={{}} className="h-72 w-full">
                                <ResponsiveContainer>
                                    <AreaChart data={dailyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <XAxis dataKey="date" />
                                        <YAxis tickFormatter={(value) => `$${value}`} />
                                        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-6 w-6"/> Top 5 Itens Mais Vendidos</CardTitle>
                            <CardDescription>Itens mais populares por quantidade vendida.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ChartContainer config={{}} className="h-72 w-full">
                                <ResponsiveContainer>
                                     <PieChart>
                                        <Pie data={topSellingItems} dataKey="quantity" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                            {topSellingItems.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                             </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            )}
        </main>
    </div>
  );
}
