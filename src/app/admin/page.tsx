"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPortal } from '@/components/AdminPortal';

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
}

export default function AdminDashboard() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [currentSharePrice, setCurrentSharePrice] = useState(1.80);
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

  // Fetch current share price for AdminPortal
  const fetchSharePrice = useCallback(async () => {
    try {
      const response = await fetch('/api/share-price');
      const data = await response.json();
      if (data.success && data.sharePrice) {
        setCurrentSharePrice(data.sharePrice);
      }
    } catch (error) {
      console.error('Failed to fetch share price:', error);
    }
  }, []);

  const handlePriceUpdate = (newPrice: number) => {
    setCurrentSharePrice(newPrice);
  };


  useEffect(() => {
    fetchSubscribers();
    fetchSharePrice();

    // Update share price every second to show fluctuation
    const interval = setInterval(fetchSharePrice, 1000);
    return () => clearInterval(interval);
  }, [fetchSubscribers, fetchSharePrice]);

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

        {/* Fund Parameters Management */}
        <div className="mb-8">
          <AdminPortal
            currentPrice={currentSharePrice}
            onPriceUpdate={handlePriceUpdate}
          />
        </div>

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