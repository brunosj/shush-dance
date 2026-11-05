'use client';

import { useCallback, useEffect, useState } from 'react';

import { formatCurrency } from '../../../_utilities/formatters';

const POLL_MS = 15_000;

type TrackerPayload = {
  ok: true;
  generatedAt: string;
  event: {
    id: string;
    slug: string;
    title: string;
    date: string | null;
    location: string | null;
    currency: string;
  };
  totals: {
    tickets: number;
    orders: number;
    revenue: number;
  };
  tiers: {
    name: string;
    quantity: number;
    orders: number;
    revenue: number;
  }[];
};

type TrackerError = { ok: false; error: string };

function formatEventDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Berlin',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatUpdatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Berlin',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function EventTicketTracker({
  slug,
  trackerKey,
}: {
  slug: string;
  trackerKey: string | null;
}) {
  const [data, setData] = useState<TrackerPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchAt, setLastFetchAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    const base =
      process.env.NEXT_PUBLIC_PAYLOAD_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    const params = new URLSearchParams({ slug });
    if (trackerKey) params.set('key', trackerKey);

    try {
      const res = await fetch(
        `${base}/api/public-event-ticket-stats?${params.toString()}`,
        { cache: 'no-store' },
      );
      const json = (await res.json()) as TrackerPayload | TrackerError;
      if (!res.ok || json.ok === false) {
        setError(
          json && 'error' in json && json.error
            ? json.error
            : `Failed (${res.status})`,
        );
        setData(null);
        return;
      }
      setData(json);
      setError(null);
      setLastFetchAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [slug, trackerKey]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-neutral-500">
        Loading ticket stats…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-medium text-neutral-800">
          Tracker unavailable
        </p>
        <p className="mt-2 text-sm text-neutral-500">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { event, totals, tiers } = data;
  const currency = event.currency || 'EUR';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8 border-b border-neutral-200 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
          Live ticket tracker
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          {event.title}
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          {formatEventDate(event.date)}
          {event.location ? ` · ${event.location}` : ''}
        </p>
        <p className="mt-2 text-xs text-neutral-400">
          Updates every {POLL_MS / 1000}s
          {lastFetchAt ? ` · last refresh ${formatUpdatedAt(lastFetchAt)}` : ''}
          {error ? ` · refresh error: ${error}` : ''}
        </p>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Tickets sold" value={String(totals.tickets)} />
        <StatCard label="Orders" value={String(totals.orders)} />
        <StatCard
          label="Collected"
          value={formatCurrency(totals.revenue, currency)}
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-[0.12em] text-neutral-500">
          By tier
        </h2>
        {tiers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-sm text-neutral-500">
            No paid ticket sales imported yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium text-right">Tickets</th>
                  <th className="px-4 py-3 font-medium text-right">Orders</th>
                  <th className="px-4 py-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr
                    key={tier.name}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {tier.name}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {tier.quantity}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-600">
                      {tier.orders}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(tier.revenue, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-8 text-center text-xs text-neutral-400">
        Aggregates only · no customer details
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-4 py-5">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-neutral-900">
        {value}
      </p>
    </div>
  );
}
