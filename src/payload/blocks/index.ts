import type { Block } from 'payload';

import { NewsletterEmbed } from './NewsletterEmbed';

export const pageBlocks: Block[] = [NewsletterEmbed];

export { NewsletterEmbed, extractIframeSrc } from './NewsletterEmbed';
