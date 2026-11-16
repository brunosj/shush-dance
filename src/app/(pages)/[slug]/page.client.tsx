// page.client.tsx
'use client';

import { useLivePreview } from '@payloadcms/live-preview-react';

import componentMapping, {
  DefaultPageComponent,
} from '../../_components/componentMapping';

interface PageTemplateProps {
  slug: string;
  data: any;
}

export const PageTemplate: React.FC<PageTemplateProps> = ({ slug, data }) => {
  const Component = componentMapping[slug] || DefaultPageComponent;

  const liveData = useLivePreview({
    serverURL: process.env.NEXT_PUBLIC_PAYLOAD_URL || '',
    depth: 2,
    initialData: data.page,
  });

  return (
    <main>
      <Component data={{ ...data, page: liveData }} />
    </main>
  );
};
