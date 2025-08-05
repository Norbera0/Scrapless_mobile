
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useInsightStore } from '@/stores/insight-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { isWithinInterval, add } from 'date-fns';
import { useSavingsStore } from '@/stores/savings-store';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { logs } = useWasteLogStore();
  const { insights } = useInsightStore();
  const { liveItems } = usePantryLogStore();
  const { savingsEvents } = useSavingsStore();
  
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Calculate weekly stats
  const weeklyStats = logs
    .filter(log => isWithinInterval(new Date(log.date), { 
      start: new Date(new Date().setDate(new Date().getDate() - 7)), 
      end: new Date() 
    }))
    .reduce((acc, log) => {
      acc.totalCarbonFootprint += log.totalCarbonFootprint;
      return acc;
    }, { totalCarbonFootprint: 0 });

  const weeklySavings = savingsEvents
    .filter(event => isWithinInterval(new Date(event.date), {
        start: new Date(new Date().setDate(new Date().getDate() - 7)),
        end: new Date()
    }))
    .reduce((acc, event) => acc + event.amount, 0);

  // Calculate pantry health stats
  const freshItems = liveItems.filter(item => {
    const expirationDate = new Date(item.estimatedExpirationDate);
    const threeDaysFromNow = add(new Date(), { days: 3 });
    return expirationDate > threeDaysFromNow;
  });

  const expiringSoonItems = liveItems.filter(item => {
    const expirationDate = new Date(item.estimatedExpirationDate);
    const today = new Date();
    const threeDaysFromNow = add(today, { days: 3 });
    return expirationDate >= today && expirationDate <= threeDaysFromNow;
  });

  const expiredItems = liveItems.filter(item => 
    new Date(item.estimatedExpirationDate) < new Date()
  );

  const healthPercentage = liveItems.length > 0 
    ? Math.round((freshItems.length / liveItems.length) * 100) 
    : 0;

  // Sample watchlist items - you can replace with actual data
  const watchlistItems = [
    { name: "🍌 Bangus", daysLeft: 0, status: "Today" },
    { name: "🥬 Galunggong", daysLeft: 4, status: "4 days" },
    { name: "🍖 Pork Chop", daysLeft: 2, status: "2 days" },
    { name: "🥬 Liempo", daysLeft: 2, status: "2 days" },
    { name: "🍗 Chicken Breast", daysLeft: 4, status: "4 days" },
    { name: "🍞 Bread", daysLeft: 1, status: "1 day" },
    { name: "🍉 Watermelon", daysLeft: 2, status: "2 days" }
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
      {/* Greeting Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          {greeting}, {user?.name?.split(' ')[0] || 'Raphael'}!
        </h1>
        <p className="text-gray-600">Let's reduce waste together</p>
      </div>

      {/* This Week's Impact */}
      <Card className="bg-pink-50 border-pink-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-pink-200 rounded flex items-center justify-center">
              📊
            </div>
            <h2 className="text-lg font-semibold text-gray-900">This Week's Impact</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Your waste tracking results</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  💸
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-green-600">
                    ₱{weeklySavings.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-500">Virtual Savings</div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  🌍
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-red-600">
                    {weeklyStats.totalCarbonFootprint.toFixed(2)} kg
                  </div>
                  <div className="text-sm text-red-500">Carbon Footprint</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          className="h-12 md:h-16 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300"
          variant="outline"
          onClick={() => router.push('/add-to-pantry')}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-yellow-200 rounded flex items-center justify-center">
              🛒
            </div>
            <span className="font-medium text-sm md:text-base">Add Groceries</span>
          </div>
        </Button>
        
        <Button
          className="h-12 md:h-16 bg-green-100 hover:bg-green-200 text-green-800 border border-green-300"
          variant="outline"
          onClick={() => router.push('/log-waste')}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-green-200 rounded flex items-center justify-center">
              📸
            </div>
            <span className="font-medium text-sm md:text-base">Log Food Waste</span>
          </div>
        </Button>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <Card className="bg-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">✨ Your frequently waste portions</h3>
                <p className="text-sm text-green-100">Fresh AI Insight</p>
                <Badge className="mt-2 bg-green-500 hover:bg-green-500">AI Powered</Badge>
              </div>
              <Button size="icon" variant="ghost" className="text-white hover:bg-green-500">
                →
              </Button>
            </div>
            
            <div className="bg-green-500 rounded-lg p-4">
              <p className="text-sm">
                "Try reducing the amount you cook in a single batch, starting with smaller portions and adjust based on what you actually consume to minimize leftovers."
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">🎉 Great Progress!</h3>
                <p className="text-sm text-gray-600">This week's update</p>
                <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">On track</Badge>
              </div>
              <Button size="icon" variant="ghost">
                →
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Waste Budget</span>
                <span className="text-2xl font-bold">65%</span>
              </div>
              <Progress value={65} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pantry Health Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 text-blue-600">📊</div>
              <div>
                <h3 className="text-lg font-semibold">Pantry Health Score</h3>
                <p className="text-sm text-gray-600">Current inventory status</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{healthPercentage}%</div>
                    <div className="text-sm text-gray-600">Inventory Health</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{freshItems.length} items - Fresh</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">{expiringSoonItems.length} items - Expiring Soon</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">{expiredItems.length} items - Expired</span>
                </div>
              </div>
            </div>
            
            <Button variant="link" className="w-full mt-4 text-center">
              View Pantry →
            </Button>
          </CardContent>
        </Card>

        {/* Pantry Watchlist */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 text-yellow-600">⚠️</div>
              <div>
                <h3 className="text-lg font-semibold">Pantry Watchlist</h3>
                <p className="text-sm text-gray-600">Items needing attention</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm font-medium text-gray-600 mb-3">
                <span>Items</span>
                <span className="text-right">Days Expiring</span>
              </div>
              
              {watchlistItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm">{item.name}</span>
                  <span className={`text-sm font-medium ${
                    item.daysLeft === 0 ? 'text-red-600' : 
                    item.daysLeft <= 2 ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
