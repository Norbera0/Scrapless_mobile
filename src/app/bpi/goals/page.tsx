'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

export default function BpiGoalsPage() {
  const [goal, setGoal] = useState<'Solar Panel' | 'EV Downpayment'>('Solar Panel');
  const [target, setTarget] = useState<number>(50000);
  const [monthly, setMonthly] = useState<number>(2500);

  const months = useMemo(() => (target > 0 && monthly > 0 ? Math.ceil(target / monthly) : 0), [target, monthly]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Goal-based Savings (Mock)</h1>
      <Card>
        <CardHeader>
          <CardTitle>Set a goal</CardTitle>
          <CardDescription>Link sustainability milestones to BPI savings products</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="text-sm">Goal</Label>
            <select className="mt-1 w-full rounded-md border p-2 text-sm" value={goal} onChange={(e) => setGoal(e.target.value as any)}>
              <option>Solar Panel</option>
              <option>EV Downpayment</option>
            </select>
          </div>
          <div>
            <Label className="text-sm">Target amount (₱)</Label>
            <Input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-sm">Monthly save (₱)</Label>
            <Input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} />
          </div>
          <div className="md:col-span-3">
            <div className="flex items-center justify-between text-sm">
              <span>{goal}</span>
              <span>{months} months</span>
            </div>
            <Progress value={Math.min(100, (monthly / target) * 100)} className="mt-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


