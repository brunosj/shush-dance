import type { Block } from 'payload/types';

import { NewsletterEmbed } from './NewsletterEmbed';

export const pageBlocks: Block[] = [NewsletterEmbed];

export { NewsletterEmbed, extractIframeSrc } from './NewsletterEmbed';
