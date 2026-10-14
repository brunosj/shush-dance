import { EventTicketTracker } from './tracker.client';

type PageProps = {
  params: { slug: string };
  searchParams?: { key?: string };
};

export function generateMetadata({ params }: PageProps) {
  return {
    title: `Ticket tracker · ${params.slug}`,
    robots: { index: false, follow: false },
  };
}

export default function EventTicketTrackerPage({
  params,
  searchParams,
}: PageProps) {
  return (
    <main className='min-h-screen bg-neutral-50 text-neutral-900'>
      <EventTicketTracker
        slug={params.slug}
        trackerKey={searchParams?.key || null}
      />
    </main>
  );
}
