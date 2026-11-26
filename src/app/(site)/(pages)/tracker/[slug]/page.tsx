import { EventTicketTracker } from './tracker.client';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ key?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Ticket tracker · ${slug}`,
    robots: { index: false, follow: false },
  };
}

export default async function EventTicketTrackerPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <EventTicketTracker
        slug={slug}
        trackerKey={resolvedSearchParams?.key || null}
      />
    </main>
  );
}
