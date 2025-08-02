
'use client';

import { useMemo } from 'react';
import { usePantryLogStore } from '@/stores/pantry-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, startOfToday } from 'date-fns';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const getFreshness = (expirationDate: string) => {
    const today = startOfToday();
    const expiry = new Date(expirationDate);
    const daysLeft = differenceInDays(expiry, today);

    if (daysLeft < 0) return { status: 'expired', days: daysLeft };
    if (daysLeft <= 3) return { status: 'expiring', days: daysLeft };
    return { status: 'fresh', days: daysLeft };
};

const emojiMap: { [key: string]: string } = {
    tomatoes: '🍅',
    milk: '🥛',
    lettuce: '🥬',
    apple: '🍎',
    banana: '🍌',
    bread: '🍞',
    cheese: '🧀',
    egg: '🥚',
    meat: '🥩',
    fish: '🐟',
    potato: '🥔',
    onion: '🧅',
    carrot: '🥕',
    default: '🥬'
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export function PantryHealthScore() {
    const { liveItems } = usePantryLogStore();

    const healthData = useMemo(() => {
        if (liveItems.length === 0) {
            return {
                score: 100,
                fresh: 0,
                expiring: 0,
                expired: 0,
                expiringThisWeek: []
            };
        }

        let fresh = 0;
        let expiring = 0;
        let expired = 0;
        const expiringThisWeek: { name: string; days: number }[] = [];

        liveItems.forEach(item => {
            const { status, days } = getFreshness(item.estimatedExpirationDate);
            switch (status) {
                case 'fresh':
                    fresh++;
                    break;
                case 'expiring':
                    expiring++;
                    expiringThisWeek.push({ name: item.name, days });
                    break;
                case 'expired':
                    expired++;
                    break;
            }
        });
        
        const totalItems = liveItems.length;
        const score = Math.round(((totalItems - expired) / totalItems) * 100);

        return { score, fresh, expiring, expired, expiringThisWeek };

    }, [liveItems]);
    
    const getEmoji = (name: string) => {
        const lowerName = name.toLowerCase();
        for (const key in emojiMap) {
            if (lowerName.includes(key)) {
                return emojiMap[key];
            }
        }
        return emojiMap.default;
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'from-green-500 to-green-600';
        if (score >= 60) return 'from-yellow-500 to-yellow-600';
        return 'from-red-500 to-red-600';
    };

    const getHealthMessage = (score: number) => {
        if (score >= 90) return 'Excellent Inventory Health';
        if (score >= 80) return 'Good Inventory Health';
        if (score >= 60) return 'Fair Inventory Health';
        return 'Needs Attention';
    };

    return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="bg-gradient-to-br from-card via-card to-green-50/30 border-border rounded-2xl shadow-lg text-card-foreground overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/2 via-transparent to-blue-500/2 rounded-2xl"></div>
              <CardHeader className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">Pantry Health Score</CardTitle>
                      <CardDescription className="text-muted-foreground">Current inventory status</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                  <motion.div 
                    variants={itemVariants}
                    className="flex items-center gap-6"
                  >
                      <div className="relative">
                          <div
                              className="relative h-24 w-24 rounded-full"
                              style={{
                                  background: `conic-gradient(from 0deg, hsl(var(--primary)) ${healthData.score * 3.6}deg, hsl(var(--muted)) 0deg)`,
                              }}
                          >
                              <div className="absolute inset-3 bg-background rounded-full flex items-center justify-center shadow-inner">
                                  <span className={`text-2xl font-bold ${getScoreColor(healthData.score)}`}>
                                    {healthData.score}%
                                  </span>
                              </div>
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                            className="absolute -top-1 -right-1"
                          >
                            {healthData.score >= 80 ? (
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            ) : healthData.score >= 60 ? (
                              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Clock className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                            )}
                          </motion.div>
                    </div>
                      <div className="flex-1">
                          <h3 className={`text-xl font-bold mb-1 ${getScoreColor(healthData.score)}`}>
                            {getHealthMessage(healthData.score)}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-3">
                              {healthData.fresh} items fresh, {healthData.expiring} expiring soon
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {healthData.fresh} Fresh
                            </Badge>
                            {healthData.expiring > 0 && (
                              <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">
                                <Clock className="w-3 h-3 mr-1" />
                                {healthData.expiring} Soon
                              </Badge>
                            )}
                            {healthData.expired > 0 && (
                              <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {healthData.expired} Expired
                              </Badge>
                            )}
                    </div>
                </div>
                  </motion.div>

                  <motion.div 
                    variants={itemVariants}
                    className="grid grid-cols-3 gap-3"
                  >
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 rounded-xl text-center"
                      >
                          <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-700" />
                          </div>
                          <p className="font-bold text-2xl text-green-800">{healthData.fresh}</p>
                          <p className="text-xs text-green-700 font-medium">Fresh Items</p>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 p-4 rounded-xl text-center"
                      >
                          <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Clock className="w-4 h-4 text-yellow-700" />
                          </div>
                          <p className="font-bold text-2xl text-yellow-800">{healthData.expiring}</p>
                          <p className="text-xs text-yellow-700 font-medium">Expiring Soon</p>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-4 rounded-xl text-center"
                      >
                          <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-700" />
                          </div>
                          <p className="font-bold text-2xl text-red-800">{healthData.expired}</p>
                          <p className="text-xs text-red-700 font-medium">Expired</p>
                      </motion.div>
                  </motion.div>
                
                {healthData.expiringThisWeek.length > 0 && (
                      <motion.div 
                        variants={itemVariants}
                        className="bg-gradient-to-r from-yellow-50 via-yellow-50/50 to-orange-50 p-4 rounded-xl border border-yellow-200"
                      >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-yellow-200 rounded-lg flex items-center justify-center">
                              <AlertTriangle className="w-3 h-3 text-yellow-700" />
                            </div>
                            <h4 className="text-sm font-bold text-yellow-800">Expiring This Week:</h4>
                          </div>
                         <div className="flex flex-wrap gap-2">
                             {healthData.expiringThisWeek.map((item, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * index }}
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    <Badge 
                                      variant="outline" 
                                      className="bg-white/50 border-yellow-300 text-yellow-800 font-medium hover:bg-yellow-100 transition-colors"
                                    >
                                        {getEmoji(item.name)} {item.name} 
                                        <span className="ml-1 text-xs">
                                          ({item.days === 0 ? 'today' : `${item.days} day${item.days === 1 ? '' : 's'}`})
                                        </span>
                                </Badge>
                                  </motion.div>
                             ))}
                        </div>
                      </motion.div>
                  )}

                  {liveItems.length === 0 && (
                    <motion.div 
                      variants={itemVariants}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-muted-foreground" />
                    </div>
                      <h3 className="font-semibold text-muted-foreground mb-2">Your pantry is empty</h3>
                      <p className="text-sm text-muted-foreground">Add some items to start tracking your pantry health!</p>
                    </motion.div>
                )}
            </CardContent>
        </Card>
        </motion.div>
    );
}
