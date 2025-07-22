
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { getWasteLogsForUser, deleteWasteLog } from '@/lib/data';
import type { WasteLog, User } from '@/types';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export function TrendsDashboard() {
  const [logs, setLogs] = useState<WasteLog[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('scrapless-user');
    if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setLogs(getWasteLogsForUser(parsedUser.email));
    }
  }, []);

  const handleDelete = (logId: string) => {
    deleteWasteLog(logId);
    if(user) {
        setLogs(getWasteLogsForUser(user.email));
    }
  }

  const chartData = useMemo(() => {
    const data = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, 'MMM d'),
        totalPesoValue: 0,
      };
    }).reverse();

    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));

    logs.forEach(log => {
      const logDate = new Date(log.date);
      if (isAfter(logDate, sevenDaysAgo)) {
        const formattedDate = format(logDate, 'MMM d');
        const dayData = data.find(d => d.date === formattedDate);
        if (dayData) {
          dayData.totalPesoValue += log.totalPesoValue;
        }
      }
    });

    return data;
  }, [logs]);
  
  const chartConfig = {
    totalPesoValue: {
      label: "Peso Value (₱)",
      color: "hsl(var(--primary))",
    },
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>7-Day Waste Trend</CardTitle>
          <CardDescription>Estimated peso value of waste over the last week.</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    />
                    <YAxis
                        tickFormatter={(value) => `₱${value}`}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="totalPesoValue" fill="var(--color-totalPesoValue)" radius={4} />
                </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Waste Log History</h2>
        <div className="space-y-4">
          {logs.length > 0 ? (
            logs.map(log => (
              <Card key={log.id} className="overflow-hidden">
                <div className="grid md:grid-cols-3">
                    {log.photoDataUri && (
                         <div className="md:col-span-1">
                            <Image src={log.photoDataUri} alt="Wasted food" width={300} height={300} className="object-cover w-full h-full" data-ai-hint="food waste" />
                         </div>
                    )}
                    <div className={log.photoDataUri ? "md:col-span-2" : "md:col-span-3"}>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle>Log - {format(new Date(log.date), 'MMMM d, yyyy')}</CardTitle>
                                <CardDescription>
                                Total Impact: ₱{log.totalPesoValue.toFixed(2)} | {log.totalCarbonFootprint.toFixed(2)}kg CO₂e
                                </CardDescription>
                            </div>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this waste log.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(log.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                {log.items.map(item => (
                                <li key={item.id} className="flex justify-between">
                                    <span>{item.estimatedAmount} {item.name}</span>
                                    <span className="font-mono text-foreground">₱{item.pesoValue.toFixed(2)}</span>
                                </li>
                                ))}
                            </ul>
                        </CardContent>
                    </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">No waste logs yet. Go to the "Log Waste" page to add your first entry.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
