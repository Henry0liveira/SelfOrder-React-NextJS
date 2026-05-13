"use client";

import { useMemo, useState } from 'react';
import { useUser, useCollectionQuery, useDoc } from '@/firebase';
import type { Order, Restaurant } from '@/types';
import { Loader2, ArrowLeft, Download, BarChart, PieChartIcon, TrendingUp, ShoppingBag, Star, Clock, Users, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  Area, AreaChart, Bar, BarChart as RechartsBarChart,
  Pie, PieChart, ResponsiveContainer, XAxis, YAxis,
  Tooltip, Legend, Cell, CartesianGrid, LineChart, Line
} from 'recharts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const formatDate = (date: Date) => format(date, 'dd/MM', { locale: ptBR });
const formatMonth = (date: Date) => format(date, 'MMM', { locale: ptBR });

const PIE_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#ec4899', '#84cc16'];

function KPICard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 ${trend.value < 0 ? 'rotate-180' : ''}`} />
            {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function KpiPage() {
  const { user, loading: userLoading } = useUser();
  const { data: restaurant, loading: restaurantLoading } = useDoc<Restaurant>('restaurants', user?.uid || '');
  const [period, setPeriod] = useState<'7' | '30' | '90' | 'all'>('30');
  
  const { data: orders, loading: ordersLoading } = useCollectionQuery<Order>(
    restaurant?.id ? 'orders' : '',
    [{ field: 'restaurantId', operator: '==', value: restaurant?.id || '' }, { field: 'status', operator: '==', value: 'completed' }]
  );

  const loading = userLoading || restaurantLoading || ordersLoading;

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (period === 'all') return orders;
    const cutoff = startOfDay(subDays(new Date(), parseInt(period)));
    return orders.filter(o => {
      if (!(o.timestamp instanceof Timestamp)) return false;
      return o.timestamp.toDate() >= cutoff;
    });
  }, [orders, period]);

  const analytics = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, avgRating: 0,
        uniqueCustomers: 0, dailyRevenue: [], topSellingItems: [],
        categoryRevenue: [], hourlyDistribution: [], weeklyRevenue: [],
        itemsByCategory: {}, revenueGrowth: 0
      };
    }

    // Core metrics
    const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalRevenue / totalOrders;
    const ratingsOrders = filteredOrders.filter(o => o.rating);
    const avgRating = ratingsOrders.length > 0 
      ? ratingsOrders.reduce((s, o) => s + (o.rating || 0), 0) / ratingsOrders.length 
      : 0;
    const uniqueCustomers = new Set(filteredOrders.map(o => o.customerUid)).size;

    // Daily revenue
    const revenueMap = new Map<string, { revenue: number; orders: number; date: Date }>();
    filteredOrders.forEach(order => {
      if (order.timestamp instanceof Timestamp) {
        const date = order.timestamp.toDate();
        const dateStr = formatDate(date);
        const existing = revenueMap.get(dateStr) || { revenue: 0, orders: 0, date };
        revenueMap.set(dateStr, {
          revenue: existing.revenue + order.total,
          orders: existing.orders + 1,
          date
        });
      }
    });
    const dailyRevenue = Array.from(revenueMap.entries())
      .map(([date, { revenue, orders }]) => ({ date, revenue: parseFloat(revenue.toFixed(2)), orders }))
      .sort((a, b) => {
        const [dA, mA] = a.date.split('/').map(Number);
        const [dB, mB] = b.date.split('/').map(Number);
        return mA !== mB ? mA - mB : dA - dB;
      });

    // Top selling items
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number; category: string }>();
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemMap.get(item.menuItemId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          itemMap.set(item.menuItemId, {
            name: item.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
            category: item.category || 'Outros'
          });
        }
      });
    });
    const topSellingItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8)
      .map(i => ({ ...i, revenue: parseFloat(i.revenue.toFixed(2)) }));

    // Revenue by category
    const catMap = new Map<string, { revenue: number; quantity: number }>();
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const cat = item.category || 'Outros';
        const existing = catMap.get(cat) || { revenue: 0, quantity: 0 };
        catMap.set(cat, {
          revenue: existing.revenue + item.price * item.quantity,
          quantity: existing.quantity + item.quantity
        });
      });
    });
    const categoryRevenue = Array.from(catMap.entries())
      .map(([name, { revenue, quantity }]) => ({ name, revenue: parseFloat(revenue.toFixed(2)), quantity }))
      .sort((a, b) => b.revenue - a.revenue);

    // Items by category for pie chart
    const itemsByCategory = categoryRevenue.reduce((acc, cat) => {
      acc[cat.name] = cat.quantity;
      return acc;
    }, {} as Record<string, number>);

    // Hourly distribution
    const hourMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) hourMap.set(i, 0);
    filteredOrders.forEach(order => {
      if (order.timestamp instanceof Timestamp) {
        const hour = order.timestamp.toDate().getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      }
    });
    const hourlyDistribution = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour: `${hour}h`, count }));

    // Weekly revenue for the last few weeks
    const weekMap = new Map<string, number>();
    filteredOrders.forEach(order => {
      if (order.timestamp instanceof Timestamp) {
        const date = order.timestamp.toDate();
        const weekStr = format(date, "'Sem' w", { locale: ptBR });
        weekMap.set(weekStr, (weekMap.get(weekStr) || 0) + order.total);
      }
    });
    const weeklyRevenue = Array.from(weekMap.entries())
      .map(([week, revenue]) => ({ week, revenue: parseFloat(revenue.toFixed(2)) }))
      .slice(-8);

    // Simple growth: compare first vs last half of filtered period
    const half = Math.floor(filteredOrders.length / 2);
    const firstHalf = filteredOrders.slice(0, half).reduce((s, o) => s + o.total, 0);
    const secondHalf = filteredOrders.slice(half).reduce((s, o) => s + o.total, 0);
    const revenueGrowth = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

    return {
      totalRevenue, totalOrders, avgOrderValue, avgRating,
      uniqueCustomers, dailyRevenue, topSellingItems,
      categoryRevenue, hourlyDistribution, weeklyRevenue,
      itemsByCategory, revenueGrowth
    };
  }, [filteredOrders]);
  
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(analytics.dailyRevenue);
    XLSX.utils.book_append_sheet(wb, ws1, 'Faturamento Diário');
    const ws2 = XLSX.utils.json_to_sheet(analytics.topSellingItems);
    XLSX.utils.book_append_sheet(wb, ws2, 'Top Itens');
    const ws3 = XLSX.utils.json_to_sheet(analytics.categoryRevenue);
    XLSX.utils.book_append_sheet(wb, ws3, 'Por Categoria');
    XLSX.writeFile(wb, `kpis_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
    );
  }

  const noData = !filteredOrders || filteredOrders.length === 0;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/staff/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel</Link>
          </Button>
          <h1 className="text-xl font-bold font-headline">Dashboard & KPIs</h1>
          <Button onClick={handleExport} size="sm" disabled={noData}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Period Filter */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold font-headline">{restaurant.name}</h2>
            <p className="text-muted-foreground text-sm">Pedidos concluídos</p>
          </div>
          <div className="flex gap-2">
            {(['7', '30', '90', 'all'] as const).map(p => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === 'all' ? 'Tudo' : `${p}d`}
              </Button>
            ))}
          </div>
        </div>

        {noData ? (
          <Card className="text-center py-16">
            <CardHeader>
              <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                <BarChart className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="mt-4">Nenhum dado para exibir</CardTitle>
              <CardDescription>
                Não há pedidos concluídos para o período selecionado.<br />
                Use o "Gerador de Dados de Teste" no painel para popular os dados.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KPICard
                title="Faturamento Total"
                value={`R$${analytics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                icon={DollarSign}
                trend={{ value: analytics.revenueGrowth, label: 'vs período anterior' }}
              />
              <KPICard
                title="Pedidos Realizados"
                value={analytics.totalOrders.toString()}
                subtitle={`${(analytics.totalOrders / Math.max(parseInt(period === 'all' ? '30' : period), 1)).toFixed(1)}/dia (média)`}
                icon={ShoppingBag}
              />
              <KPICard
                title="Ticket Médio"
                value={`R$${analytics.avgOrderValue.toFixed(2)}`}
                icon={TrendingUp}
              />
              <KPICard
                title="Avaliação Média"
                value={analytics.avgRating > 0 ? `${analytics.avgRating.toFixed(1)} ⭐` : 'N/A'}
                subtitle={`${filteredOrders.filter(o => o.rating).length} avaliações`}
                icon={Star}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <KPICard
                title="Clientes Únicos"
                value={analytics.uniqueCustomers.toString()}
                icon={Users}
              />
              <KPICard
                title="Categorias Vendidas"
                value={analytics.categoryRevenue.length.toString()}
                icon={Package}
              />
              <KPICard
                title="Itens no Menu Vendidos"
                value={analytics.topSellingItems.length.toString()}
                icon={BarChart}
              />
            </div>

            {/* Charts Tabs */}
            <Tabs defaultValue="revenue" className="space-y-6">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1">
                <TabsTrigger value="revenue" className="py-2">Faturamento</TabsTrigger>
                <TabsTrigger value="items" className="py-2">Produtos</TabsTrigger>
                <TabsTrigger value="categories" className="py-2">Categorias</TabsTrigger>
                <TabsTrigger value="operations" className="py-2">Operações</TabsTrigger>
              </TabsList>

              {/* Revenue Tab */}
              <TabsContent value="revenue" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" /> Faturamento Diário
                      </CardTitle>
                      <CardDescription>Receita de pedidos concluídos por dia</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-72 w-full">
                        <ResponsiveContainer>
                          <AreaChart data={analytics.dailyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number) => [`R$${v.toFixed(2)}`, 'Receita']} />
                            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-primary" /> Pedidos por Dia
                      </CardTitle>
                      <CardDescription>Quantidade de pedidos por dia</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-72 w-full">
                        <ResponsiveContainer>
                          <RechartsBarChart data={analytics.dailyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number) => [v, 'Pedidos']} />
                            <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Items Tab */}
              <TabsContent value="items" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" /> Top Itens por Quantidade
                      </CardTitle>
                      <CardDescription>Produtos mais pedidos no período</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-72 w-full">
                        <ResponsiveContainer>
                          <RechartsBarChart data={analytics.topSellingItems} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                            <Tooltip formatter={(v: number) => [v, 'Pedidos']} />
                            <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
                              {analytics.topSellingItems.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" /> Receita por Item
                      </CardTitle>
                      <CardDescription>Faturamento gerado por cada produto</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mt-2">
                        {analytics.topSellingItems.slice(0, 6).map((item, i) => {
                          const maxRevenue = analytics.topSellingItems[0]?.revenue || 1;
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium truncate max-w-[60%]">{item.name}</span>
                                <span className="font-bold text-primary">R${item.revenue.toFixed(2)}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all"
                                  style={{
                                    width: `${(item.revenue / maxRevenue) * 100}%`,
                                    backgroundColor: PIE_COLORS[i % PIE_COLORS.length]
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5 text-primary" /> Itens por Categoria
                      </CardTitle>
                      <CardDescription>Distribuição de pedidos por categoria de produto</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-72 w-full">
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={analytics.categoryRevenue}
                              dataKey="quantity"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {analytics.categoryRevenue.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number, name: string) => [v, 'Itens']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" /> Receita por Categoria
                      </CardTitle>
                      <CardDescription>Faturamento total agrupado por categoria</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-72 w-full">
                        <ResponsiveContainer>
                          <RechartsBarChart data={analytics.categoryRevenue} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                            <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number) => [`R$${v.toFixed(2)}`, 'Receita']} />
                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                              {analytics.categoryRevenue.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Category breakdown table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left pb-2">Categoria</th>
                            <th className="text-right pb-2">Qtd. Itens</th>
                            <th className="text-right pb-2">Receita</th>
                            <th className="text-right pb-2">% do Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.categoryRevenue.map((cat, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                {cat.name}
                              </td>
                              <td className="py-2 text-right">{cat.quantity}</td>
                              <td className="py-2 text-right font-mono">R${cat.revenue.toFixed(2)}</td>
                              <td className="py-2 text-right">
                                <Badge variant="secondary">
                                  {((cat.revenue / analytics.totalRevenue) * 100).toFixed(1)}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Operations Tab */}
              <TabsContent value="operations" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" /> Pedidos por Hora
                      </CardTitle>
                      <CardDescription>Distribuição de pedidos ao longo do dia</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-72 w-full">
                        <ResponsiveContainer>
                          <RechartsBarChart data={analytics.hourlyDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                            <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number) => [v, 'Pedidos']} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" /> Avaliações dos Clientes
                      </CardTitle>
                      <CardDescription>Distribuição das notas recebidas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mt-2">
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = filteredOrders.filter(o => o.rating === star).length;
                          const total = filteredOrders.filter(o => o.rating).length;
                          const pct = total > 0 ? (count / total) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-3">
                              <span className="text-sm w-8">{star} ⭐</span>
                              <div className="flex-1 bg-muted rounded-full h-3">
                                <div
                                  className="h-3 rounded-full bg-amber-400 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground w-12 text-right">{count} ({pct.toFixed(0)}%)</span>
                            </div>
                          );
                        })}
                        {filteredOrders.filter(o => o.rating).length === 0 && (
                          <p className="text-muted-foreground text-sm text-center py-4">Nenhuma avaliação no período</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2 min-w-0 overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" /> Faturamento Semanal
                      </CardTitle>
                      <CardDescription>Receita consolidada por semana</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64 w-full min-w-0">
                        <ResponsiveContainer>
                          <LineChart data={analytics.weeklyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number) => [`R$${v.toFixed(2)}`, 'Receita']} />
                            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
