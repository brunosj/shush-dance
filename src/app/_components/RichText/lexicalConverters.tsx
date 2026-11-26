import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';
import { LinkJSXConverter } from '@payloadcms/richtext-lexical/react';
import escapeHTML from 'escape-html';
import React from 'react';

import Button from '../Button';
import { lexicalInternalDocToHref } from '../../../utilities/lexicalInternalDocToHref';
import {
  resolveRichTextHref,
  shouldUseNativeAnchor,
} from '../../../utilities/resolveRichTextHref';
const { link: renderLexicalLink } = LinkJSXConverter({
  internalDocToHref: lexicalInternalDocToHref,
});

export const lexicalJSXConverters: JSXConvertersFunction = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  link: (args) => {
    const { node, nodesToJSX } = args;
    const appearance = node.fields?.appearance;

    if (appearance === 'button') {
      const { href, newTab } = resolveRichTextHref({
        linkType: node.fields.linkType,
        url: node.fields.url,
        newTab: node.fields.newTab,
        doc: node.fields.doc
          ? {
              relationTo: node.fields.doc.relationTo,
              value: node.fields.doc.value,
            }
          : null,
      });
      const firstText = node.children?.[0] as { text?: string } | undefined;
      const label =
        typeof firstText?.text === 'string' ? firstText.text : 'Button';
      const target = newTab ? '_blank' : undefined;

      if (!href) {
        return (
          <div className="pt-3 mb-4">
            <Button label={label} disabled />
          </div>
        );
      }

      return (
        <div className="pt-3 mb-4">
          <Button
            href={
              shouldUseNativeAnchor(href, Boolean(newTab)) ? escapeHTML(href) : href
            }
            target={target}
            label={label}
          />
        </div>
      );
    }

    if (typeof renderLexicalLink === 'function') {
      return renderLexicalLink(args);
    }
    return null;
  },
  ...LinkJSXConverter({
    internalDocToHref: lexicalInternalDocToHref,
  }),
});