'use client';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react';
import React from 'react';

import { lexicalJSXConverters } from './lexicalConverters';
import serialize from './serialize';

function isLexicalContent(
  content: unknown,
): content is { root: unknown } {
  return (
    Boolean(content) &&
    typeof content === 'object' &&
    content !== null &&
    'root' in content
  );
}

export const RichText: React.FC<{ className?: string; content: unknown }> = ({
  className,
  content,
}) => {
  if (!content) {
    return null;
  }

  if (isLexicalContent(content)) {
    return (
      <div className={`richText ${className || ''}`}>
        <LexicalRichText
          data={content as SerializedEditorState}
          converters={lexicalJSXConverters}
        />
      </div>
    );
  }

  return (
    <div className={`richText ${className || ''}`}>
      {serialize(content as Parameters<typeof serialize>[0])}
    </div>
  );
};