import React, { useState } from 'react';
import { Button } from 'payload/components/elements';

export const SyncBandcampButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleSync = async () => {
    setIsLoading(true);
    setStatus('Starting sync...');

    try {
      const response = await fetch('/api/sync-bandcamp', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setStatus(
          `Sync complete! Found ${data.totalSales} sales, created ${data.newSales} new entries.`
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
    <div style={{ paddingLeft: '80px', paddingBottom: '10px' }}>
      <Button onClick={handleSync} disabled={isLoading}>
        {isLoading ? 'Syncing...' : 'Sync Bandcamp Sales'}
      </Button>
      {status && (
        <div
          style={{
            marginTop: '10px',
            color: status.includes('Error') ? 'red' : 'inherit',
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
};
