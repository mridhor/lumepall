"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
}

interface PriceData {
  currentPrice: number | string;
  currentSP500Price: number | string;
}

export default function AdminDashboard() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [priceData, setPriceData] = useState<PriceData>({ currentPrice: 18.49, currentSP500Price: 3.30 });
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const router = useRouter();

  const fetchSubscribers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/subscribers');
      
      if (response.status === 401) {
        console.log('Not authenticated, redirecting to login');
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setSubscribers(data.subscribers || []);
        setTotal(data.total || 0);
        setError(''); // Clear any previous errors
      } else {
        console.error('API error:', data.error);
        setError(data.error || 'Failed to fetch subscribers');
      }
    } catch (error) {
      console.error('Fetch subscribers error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchPriceData = useCallback(async () => {
    try {
      const response = await fetch('/api/price');
      const data = await response.json();
      
      if (response.ok) {
        setPriceData(data);
        setPriceError(''); // Clear any previous errors
      } else {
        console.error('Price API error:', data.error);
        setPriceError(data.error || 'Failed to fetch price data');
      }
    } catch (error) {
      console.error('Price fetch error:', error);
      setPriceError('Network error. Please check your connection and try again.');
    }
  }, []);

  const handlePriceChange = (field: 'currentPrice' | 'currentSP500Price', value: string) => {
    // Allow typing any value, including empty string and partial numbers
    // Don't convert to number immediately - let user type freely
    setPriceData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handlePriceBlur = (field: 'currentPrice' | 'currentSP500Price') => {
    // Format to 2 decimal places when user finishes typing
    const currentValue = priceData[field];
    const numValue = typeof currentValue === 'string' ? parseFloat(currentValue) || 0 : currentValue;
    
    // If value is 0, set to minimum of 0.01
    const finalValue = numValue === 0 ? 0.01 : numValue;
    const formattedValue = parseFloat(finalValue.toFixed(2));
    setPriceData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleSaveChanges = async () => {
    setPriceLoading(true);
    setPriceError('');
    
    try {
      const response = await fetch('/api/price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPrice: (() => {
            const value = typeof priceData.currentPrice === 'string' ? parseFloat(priceData.currentPrice) || 0 : priceData.currentPrice;
            return value === 0 ? 0.01 : value;
          })(),
          currentSP500Price: (() => {
            const value = typeof priceData.currentSP500Price === 'string' ? parseFloat(priceData.currentSP500Price) || 0 : priceData.currentSP500Price;
            return value === 0 ? 0.01 : value;
          })()
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Show success message briefly
        setPriceError('');
        setHasUnsavedChanges(false);
        
        // Notify main page of price update using BroadcastChannel
        try {
          const channel = new BroadcastChannel('price-updates');
          channel.postMessage('price-changed');
          channel.close();
          console.log('Price update notification sent via BroadcastChannel');
        } catch (_error) {
          console.log('BroadcastChannel not supported, using fallback');
        }
        
        // Fallback: Use localStorage to notify other tabs/windows
        localStorage.setItem('priceUpdate', Date.now().toString());
        localStorage.removeItem('priceUpdate');
        
        // Fallback: Dispatch custom event for same tab
        window.dispatchEvent(new Event('priceUpdated'));
        console.log('Price update notification sent via fallback methods');
      } else {
        setPriceError(data.error || 'Failed to update prices');
      }
    } catch {
      setPriceError('Failed to update prices');
    } finally {
      setPriceLoading(false);
    }
  };


  useEffect(() => {
    fetchSubscribers();
    fetchPriceData();
  }, [fetchSubscribers, fetchPriceData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/admin/login');
    }
  };

  const exportCSV = () => {
    const headers = ['Email', 'Subscribed At'];
    const csvContent = [
      headers.join(','),
      ...subscribers.map(sub => [
        sub.email,
        new Date(sub.subscribed_at).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snobol-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscribers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={handleLogout}
              className="cursor-pointer font-semibold"
              variant="destructive"
              size="sm"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Price Management Section */}
        <Card className="mb-8 overflow-hidden border-gray-200 bg-white">
          <CardHeader className="bg-white">
            <CardTitle className="text-xl font-bold">Price Management</CardTitle>
          </CardHeader>
          <CardContent>
            {priceError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 font-medium">
                {priceError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Price */}
              <div className="space-y-2 border-gray-200 border-sm rounded">
                <Label htmlFor="currentPrice" className="font-semibold">Lumepall Current Price</Label>
                <Input
                  id="currentPrice"
                  className="bg-white border-gray-200 border-sm rounded font-semibold"
                  type="number"
                  step="0.01"
                  min="0"
                  max="9999.99"
                  value={typeof priceData.currentPrice === 'string' ? priceData.currentPrice : (priceData.currentPrice === 0 ? '' : priceData.currentPrice.toFixed(2))}
                  onChange={(e) => handlePriceChange('currentPrice', e.target.value)}
                  onBlur={() => handlePriceBlur('currentPrice')}
                  disabled={priceLoading}
                  placeholder="1.7957"
                />
                <p className="text-xs text-muted-foreground font-medium">Type the price value (min: 0.01, max: 9999.99)</p>
              </div>
            </div>
            
            {/* Save Changes Button */}
            {hasUnsavedChanges && (
              <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={priceLoading}
                    variant="default"
                    className="min-w-[120px] font-semibold bg-black text-white hover:bg-gray-800"
                  >
                  {priceLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                  </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 font-medium">
            {error}
          </div>
        )}

        {/* Subscribers Table */}
        <Card className="overflow-hidden border-gray-200 bg-white">
          <CardHeader className="border-b border-gray-200 bg-white flex flex-row justify-between items-center">
            <CardTitle className="text-lg font-bold">Email Subscribers ({total})</CardTitle>
            <div className="flex flex-row gap-2">
            <Button
              onClick={exportCSV}
              variant="outline"
              className="bg-white border-gray-200 cursor-pointer shadow-xs font-semibold"
              size="sm"
            >
              Export CSV
            </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {subscribers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg font-semibold">No subscribers found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {subscribers.map((subscriber, index) => (
                  <div 
                    key={subscriber.id} 
                    className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                      index === 0 ? 'border-t-0' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-md font-semibold text-gray-900">
                          {subscriber.email}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 font-medium">
                          Subscribed: {new Date(subscriber.subscribed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <Button
            onClick={fetchSubscribers}
            variant="outline"
            className="font-semibold"
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}