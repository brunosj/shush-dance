'use client';

import React from 'react';

import type { Page } from '../../../payload/payload-types';
import NewsletterEmbed from './NewsletterEmbed';

type LayoutBlock = NonNullable<Page['layout']>[number];

type RenderBlocksProps = {
  blocks?: LayoutBlock[] | null;
  className?: string;
};

const RenderBlocks: React.FC<RenderBlocksProps> = ({ blocks, className }) => {
  if (!blocks?.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const key = block.id ?? `${block.blockType}-${index}`;

        switch (block.blockType) {
          case 'newsletterEmbed':
            return <NewsletterEmbed key={key} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default RenderBlocks;
