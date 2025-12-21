"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-normal">
      <div className="max-w-5xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl font-medium tracking-tight mb-2">Admin</h1>
            <p className="text-gray-600 text-lg">Manage fund parameters and subscribers</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-black transition-colors underline underline-offset-4 font-medium"
          >
            Log out
          </button>
        </div>

        {/* Fund Parameters Management */}
        <div className="mb-16">
          <AdminPortal
            currentPrice={currentSharePrice}
            onPriceUpdate={handlePriceUpdate}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded mb-8 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Subscribers Section */}
        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-xl font-medium">Subscribers <span className="text-gray-500 ml-2">{total}</span></h2>
          <div className="flex gap-6">
            <button
              onClick={fetchSubscribers}
              className="text-sm text-gray-600 hover:text-black transition-colors font-medium"
            >
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="text-sm text-gray-600 hover:text-black transition-colors font-medium"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Minimalist Table */}
        <div className="w-full">
          {subscribers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No subscribers yet
            </div>
          ) : (
            <div className="w-full">
              <div className="grid grid-cols-2 border-b border-gray-200 pb-3 mb-3 text-xs text-gray-600 uppercase tracking-wider font-semibold">
                <div>Email</div>
                <div className="text-right">Date Subscribed</div>
              </div>
              <div className="space-y-2">
                {subscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="grid grid-cols-2 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors -mx-2 px-2 rounded"
                  >
                    <div className="text-base text-gray-900 truncate pr-4 font-medium">
                      {subscriber.email}
                    </div>
                    <div className="text-right text-gray-600 text-sm">
                      {new Date(subscriber.subscribed_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}