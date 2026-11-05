/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — bundled in Payload admin; peer deps not in app tsconfig
'use client';

import { useModal } from '@faceless-ui/modal';
import { useDrawerSlug } from 'payload/components/elements';
import { reduceFieldsToValues } from 'payload/components/forms';
import {
  buildStateFromSchema,
  useAuth,
  useConfig,
  useDocumentInfo,
  useLocale,
} from 'payload/components/utilities';
import { sanitizeFields } from 'payload/config';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Editor, Transforms } from 'slate';
import { ReactEditor, useSelected, useSlateStatic } from 'slate-react';

import { getRichTextButtonFields } from '../richTextLinkFields';
import { ButtonDrawer } from './ButtonDrawer';

type RichTextButtonElementProps = {
  attributes: Record<string, unknown>;
  children: React.ReactNode;
  element: {
    label?: string;
    linkType?: string;
    url?: string;
    doc?: unknown;
    newTab?: boolean;
  };
};

const updateButton = (
  editor: Editor,
  element: RichTextButtonElementProps['element'],
  fields: unknown,
) => {
  const data = reduceFieldsToValues(
    fields as Parameters<typeof reduceFieldsToValues>[0],
    true,
  );
  const path = ReactEditor.findPath(
    editor,
    element as Parameters<typeof ReactEditor.findPath>[1],
  );

  Transforms.setNodes(
    editor,
    {
      label: String(data.label || 'Button'),
      linkType: data.linkType,
      url: data.url,
      doc: data.doc,
      newTab: data.newTab,
    } as Record<string, unknown>,
    { at: path },
  );
};

export const RichTextButtonElement: React.FC<RichTextButtonElementProps> = ({
  attributes,
  children,
  element,
}) => {
  const selected = useSelected();
  const editor = useSlateStatic();
  const { user } = useAuth();
  const { code: locale } = useLocale();
  const [initialState, setInitialState] = useState({});
  const { t } = useTranslation(['fields', 'general']);
  const config = useConfig();
  const fieldSchema = useMemo(() => {
    const fieldsUnsanitized = getRichTextButtonFields(config);
    const validRelationships = config.collections.map((c) => c.slug) || [];
    return sanitizeFields({
      config,
      fields: fieldsUnsanitized,
      validRelationships,
    });
  }, [config]);

  const { closeModal, openModal } = useModal();
  const drawerSlug = useDrawerSlug('rich-text-button-edit');
  const { getDocPreferences } = useDocumentInfo();

  const openEditor = useCallback(async () => {
    openModal(drawerSlug);
    const preferences = await getDocPreferences();
    const state = await buildStateFromSchema({
      config,
      data: {
        label: element.label || '',
        linkType: element.linkType || 'custom',
        url: element.url,
        doc: element.doc,
        newTab: element.newTab,
      },
      fieldSchema,
      locale,
      operation: 'update',
      preferences,
      t,
      user,
    });
    setInitialState(state);
  }, [
    config,
    drawerSlug,
    element,
    fieldSchema,
    getDocPreferences,
    locale,
    openModal,
    t,
    user,
  ]);

  return (
    <div
      {...attributes}
      contentEditable={false}
      className="rich-text-button-block"
      style={{
        margin: '12px 0',
        outline: selected ? '2px solid var(--theme-elevation-400)' : undefined,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          void openEditor();
        }}
        style={{
          border: '1px solid #000',
          padding: '8px 16px',
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        {element.label?.trim() || 'Button'}
      </button>
      {children}
      <ButtonDrawer
        drawerSlug={drawerSlug}
        fieldSchema={fieldSchema}
        handleModalSubmit={(fields) => {
          updateButton(editor, element, fields);
          closeModal(drawerSlug);
        }}
        initialState={initialState}
        title="Edit button"
      />
    </div>
  );
};
