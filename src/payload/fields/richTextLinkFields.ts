import type { Config } from 'payload/config';
import type { Field } from 'payload/types';
import { extractTranslations } from 'payload/utilities';

export const RICH_TEXT_LINK_RELATION_TO = ['pages', 'documents'] as const;

const translations = extractTranslations([
  'fields:linkType',
  'fields:chooseBetweenCustomTextOrDocument',
  'fields:customURL',
  'fields:internalLink',
  'fields:enterURL',
  'fields:chooseDocumentToLink',
  'fields:openInNewTab',
]);

export function getRichTextLinkTargetFields(_config: Config): Field[] {
  return [
    {
      name: 'linkType',
      admin: {
        description: translations['fields:chooseBetweenCustomTextOrDocument'],
      },
      defaultValue: 'custom',
      label: translations['fields:linkType'],
      options: [
        {
          label: translations['fields:customURL'],
          value: 'custom',
        },
        {
          label: translations['fields:internalLink'],
          value: 'internal',
        },
      ],
      required: true,
      type: 'radio',
    },
    {
      name: 'url',
      admin: {
        condition: ({ linkType }) => linkType !== 'internal',
      },
      label: translations['fields:enterURL'],
      required: true,
      type: 'text',
    },
    {
      name: 'doc',
      admin: {
        condition: ({ linkType }) => linkType === 'internal',
      },
      label: translations['fields:chooseDocumentToLink'],
      relationTo: [...RICH_TEXT_LINK_RELATION_TO],
      required: true,
      type: 'relationship',
    },
    {
      name: 'newTab',
      label: translations['fields:openInNewTab'],
      type: 'checkbox',
    },
  ];
}

export function restrictRichTextLinkDrawerFields(
  defaultFields: Field[],
): Field[] {
  return defaultFields.map((field) => {
    if ('name' in field && field.name === 'doc') {
      return {
        ...field,
        relationTo: [...RICH_TEXT_LINK_RELATION_TO],
      } as Field;
    }
    return field;
  });
}

export function getRichTextButtonFields(_config: Config): Field[] {
  return [
    {
      name: 'label',
      label: 'Button label',
      required: true,
      type: 'text',
    },
    ...getRichTextLinkTargetFields(_config),
  ];
}
