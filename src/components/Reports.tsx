import React, { useState, useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CalendarIcon
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useExpenses } from '@/hooks/useExpenses';
import { useBudgets } from '@/hooks/useBudgets';

const Reports = () => {
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    return new Date(year, month, 28);
  });
  const [dateTo, setDateTo] = useState(() => new Date());

  const { expenses, isLoading: loadingExpenses } = useExpenses();
  const { budgets, getCombinedBudgets, isLoading: loadingBudgets } = useBudgets();

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= dateFrom && d <= dateTo;
    });
  }, [expenses, dateFrom, dateTo]);

  const combinedBudgets = useMemo(() => getCombinedBudgets(), [budgets]);

  const myExpenses = useMemo(() =>
    filteredExpenses.filter(e => e.who === 'me').reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);

  const partnerExpenses = useMemo(() =>
    filteredExpenses.filter(e => e.who === 'partner').reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);

  const totalExpenses = myExpenses + partnerExpenses;

  const totalBudget = useMemo(() => {
    return Object.values(combinedBudgets).reduce((sum, b) => sum + b.amount, 0);
  }, [combinedBudgets]);

  const budgetUsage = useMemo(() => {
    return totalBudget > 0 ? Math.min(100, Math.round((totalExpenses / totalBudget) * 100)) : 0;
  }, [totalExpenses, totalBudget]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map();
    filteredExpenses.forEach(e => {
      if (!map.has(e.category)) map.set(e.category, 0);
      map.set(e.category, map.get(e.category) + e.amount);
    });
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff7f', '#ff69b4'];
    return Array.from(map.entries()).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }));
  }, [filteredExpenses]);

  const paymentBreakdown = useMemo(() => {
    const map = new Map();
    filteredExpenses.forEach(e => {
      if (!map.has(e.payment_method)) map.set(e.payment_method, 0);
      map.set(e.payment_method, map.get(e.payment_method) + e.amount);
    });
    return Array.from(map.entries()).map(([method, amount]) => ({
      method,
      amount,
      percentage: Math.round((amount / totalExpenses) * 100),
    }));
  }, [filteredExpenses, totalExpenses]);

  const topCategories = [...categoryBreakdown].sort((a, b) => b.value - a.value).slice(0, 3);

  const avgDaily = useMemo(() => {
    const days = Math.max(1, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return Math.round(totalExpenses / days);
  }, [totalExpenses, dateFrom, dateTo]);

  const dailyTrend = useMemo(() => {
    const trendMap: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      const day = new Date(exp.date).toISOString().split('T')[0];
      trendMap[day] = (trendMap[day] || 0) + exp.amount;
    });
    return Object.entries(trendMap).map(([date, total]) => ({ date, total }));
  }, [filteredExpenses]);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      return (
        <div className="bg-gray-800 text-violet-200 p-2 rounded shadow text-sm">
          <p className="font-medium">{name}</p>
          <p>Rp. {value.toLocaleString('id-ID')}</p>
        </div>
      );
    }
    return null;
  };

  const [isFromDatePopoverOpen, setIsFromDatePopoverOpen] = useState(false); // New state for add investment date popover
  const [isToDatePopoverOpen, setIsToDatePopoverOpen] = useState(false); // New state for edit investment date popover

  if (loadingExpenses || loadingBudgets) {
    return <p className="text-center text-gray-300">Loading...</p>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 text-gray-100">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-start">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <div className="flex gap-2">
          <Popover open={isFromDatePopoverOpen} onOpenChange={setIsFromDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full justify-start text-left font-normal bg-gray-700/50 border-gray-600 text-gray-50 hover:bg-violet-300"
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                From: {format(dateFrom, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(date) => {
                  date && setDateFrom(date);
                  setIsFromDatePopoverOpen(false);
                }}
                month={dateFrom}
                initialFocus
                className="text-gray-100"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium text-gray-100",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected])]:bg-gray-700 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-700 hover:text-white rounded-md",
                  day_range_end: "day-range-end",
                  day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-md",
                  day_today: "bg-gray-800 text-white rounded-md",
                  day_outside: "day-outside text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-gray-700 aria-selected:text-gray-50",
                  day_hidden: "invisible"
                }}
              />
            </PopoverContent>
          </Popover>
          <Popover open={isToDatePopoverOpen} onOpenChange={setIsToDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full justify-start text-left font-normal bg-gray-700/50 border-gray-600 text-gray-50 hover:bg-violet-300"
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                To: {format(dateTo, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(date) => {
                  date && setDateTo(date);
                  setIsToDatePopoverOpen(false);
                }}
                initialFocus
                className="text-gray-100"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium text-gray-100",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected])]:bg-gray-700 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-700 hover:text-white rounded-md",
                  day_range_end: "day-range-end",
                  day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-md",
                  day_today: "bg-gray-800 text-white rounded-md",
                  day_outside: "day-outside text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-gray-700 aria-selected:text-gray-50",
                  day_hidden: "invisible"
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses', value: totalExpenses, color: 'text-blue-400' },
          { label: 'My Expenses', value: myExpenses, color: 'text-green-400' },
          { label: "Partner's Expenses", value: partnerExpenses, color: 'text-pink-400' },
          { label: 'Budget Used', value: `${budgetUsage}%`, color: 'text-purple-400' }
        ].map((item, idx) => (
          <Card key={idx} className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${item.color}`}>
                {typeof item.value === 'number' ? `Rp. ${item.value.toLocaleString('id-ID')}` : item.value}
              </div>
              <p className="text-sm text-gray-400">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Breakdown */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={100}
                isAnimationActive
                label={({ name, value }) =>
                  `${name}: Rp. ${value.toLocaleString('id-ID')}`
                }
              >
                {categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentBreakdown.map((method, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{method.method}</span>
                  <span className="font-semibold text-blue-400">
                    Rp. {method.amount.toLocaleString('id-ID')} ({method.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${method.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget vs Actual */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Budget vs Actual (Per Category)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={categoryBreakdown.map(cat => ({
                category: cat.name,
                actual: cat.value,
                budgeted: combinedBudgets[cat.name]?.amount ?? 0,
              }))}
              margin={{ top: 10, right: 20, bottom: 30, left: 0 }}
              barCategoryGap={20}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `Rp. ${value.toLocaleString('id-ID')}`}
                contentStyle={{ backgroundColor: '#111827', color: '#F9FAFB', border: 'none', borderRadius: 8 }}
                cursor={{ fill: 'transparent' }}
              />
              <Legend wrapperStyle={{ color: '#d1d5db', fontSize: 12 }} />
              <Bar dataKey="budgeted" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Budgeted" />
              <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Daily Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrend} margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `Rp. ${value.toLocaleString('id-ID')}`}
                contentStyle={{ backgroundColor: '#111827', color: '#F9FAFB', border: 'none', borderRadius: 8 }}
                cursor={{ stroke: 'transparent', strokeWidth: 0 }}
              />
              <Legend wrapperStyle={{ color: '#d1d5db', fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 3, fill: '#1f2937' }}
                name="Total Spending"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-gray-200">Top Categories</h4>
              <div className="space-y-2">
                {topCategories.map((cat, idx) => (
                  <div key={idx} className="flex justify-between bg-gray-700 p-2 rounded">
                    <span className="text-gray-300">{cat.name}</span>
                    <span className="font-semibold text-blue-400">Rp. {cat.value.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-200">Insights</h4>
              <div className="space-y-2">
                <div className="flex justify-between bg-gray-700 p-2 rounded">
                  <span className="text-gray-300">Avg. daily spending:</span>
                  <span className="font-semibold text-blue-400">Rp. {avgDaily.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;