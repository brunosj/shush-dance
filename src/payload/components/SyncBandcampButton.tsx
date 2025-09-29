'use client';

import React, { useState, useEffect } from 'react';
import { Button } from 'payload/components/elements';

const LoadingDots = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span style={{ display: 'inline-block', width: '20px' }}>{dots}</span>;
};

export const SyncBandcampButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    fetchLastSyncTime();
  }, []);

  const fetchLastSyncTime = async () => {
    try {
      const response = await fetch('/api/globals/settings');
      const data = await response.json();
      setLastSyncedAt(data.lastBandcampSync);
    } catch (error) {
      console.error('Error fetching last sync time:', error);
    }
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSync = async () => {
    setIsLoading(true);
    setStatus('Syncing in progress...');

    try {
      const response = await fetch('/api/sync-bandcamp', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setStatus(
          `Sync complete! Found ${data.totalSales} sales, created ${data.newSales} new entries. Please refresh to consult entries`
        );
        await fetchLastSyncTime();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Sync error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleSync} disabled={isLoading}>
        {isLoading ? (
          <span>
            Syncing
            <LoadingDots />
          </span>
        ) : (
          'Sync Bandcamp Sales'
        )}
      </Button>
      {status && (
        <div
          style={{
            color: status.includes('Error') ? 'red' : 'inherit',
          }}
        >
          {status.includes('Syncing in progress') ? (
            <span>
              Syncing in progress
              <LoadingDots />
            </span>
          ) : (
            status
          )}
        </div>
      )}
      {lastSyncedAt && (
        <div
          style={{
            fontSize: '0.875rem',
            color: '#b45309',
          }}
        >
          Last synced at: {formatDateTime(lastSyncedAt)}
        </div>
      )}
    </div>
  );
};
