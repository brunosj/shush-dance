'use client';

import React from 'react';

import {
  extractIframeHeight,
  extractIframeSrc,
} from '../../../../payload/blocks/NewsletterEmbed';
import type { NewsletterEmbedBlock } from '../../../../payload/payload-types';

import styles from './index.module.css';

type NewsletterEmbedProps = {
  block: NewsletterEmbedBlock;
};

const ALLOWED_HOST_SUFFIXES = [
  'sibforms.com',
  'brevo.com',
  'sendinblue.com',
];

const DEFAULT_HEIGHT = 500;
const MOBILE_HEIGHT_FACTOR = 1.6;

function isAllowedBrevoHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

const NewsletterEmbed: React.FC<NewsletterEmbedProps> = ({ block }) => {
  const src = extractIframeSrc(block.iframeSrc);
  if (!src) return null;

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return null;
  }

  if (!isAllowedBrevoHost(parsed.hostname)) {
    return null;
  }

  const heightFromEmbed = extractIframeHeight(block.iframeSrc);
  const height =
    block.height && block.height > 0
      ? block.height
      : heightFromEmbed || DEFAULT_HEIGHT;

  const mobileHeight =
    block.mobileHeight && block.mobileHeight > 0
      ? block.mobileHeight
      : Math.round(height * MOBILE_HEIGHT_FACTOR);

  return (
    <section className="w-full my-8">
      {block.heading ? <h2 className="mb-4">{block.heading}</h2> : null}
      <iframe
        src={parsed.toString()}
        title={block.heading?.trim() || 'Newsletter signup'}
        width="100%"
        height={height}
        frameBorder={0}
        scrolling="no"
        allowFullScreen
        className={styles.iframe}
        style={
          {
            '--newsletter-iframe-height': `${height}px`,
            '--newsletter-iframe-height-mobile': `${mobileHeight}px`,
          } as React.CSSProperties
        }
      />
    </section>
  );
};

export default NewsletterEmbed;
