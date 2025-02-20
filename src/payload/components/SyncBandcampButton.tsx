import React, { useState } from 'react';
import { Button } from 'payload/components/elements';

export const SyncBandcampButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-GB', {
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
          `Sync complete! Found ${data.totalSales} sales, created ${data.newSales} new entries. Please refresh`
        );
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
    <div style={{ paddingLeft: '80px' }}>
      <Button onClick={handleSync} disabled={isLoading}>
        {isLoading ? 'Syncing...' : 'Sync Bandcamp Sales'}
      </Button>
      {status && (
        <div
          style={{
            marginTop: '10px',
            marginBottom: '10px',
            color: status.includes('Error') ? 'red' : 'inherit',
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
};
