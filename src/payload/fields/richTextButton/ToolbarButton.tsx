/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — bundled in Payload admin; peer deps not in app tsconfig
'use client';

import { useModal } from '@faceless-ui/modal';
import ElementButton from '@payloadcms/richtext-slate/dist/field/elements/Button';
import { injectVoidElement } from '@payloadcms/richtext-slate/dist/field/elements/injectVoid';
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
import React, { Fragment, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactEditor, useSlate } from 'slate-react';

import { getRichTextButtonFields } from '../richTextLinkFields';
import { ButtonDrawer } from './ButtonDrawer';

const insertButton = (editor: ReturnType<typeof useSlate>, fields: unknown) => {
  const data = reduceFieldsToValues(
    fields as Parameters<typeof reduceFieldsToValues>[0],
    true,
  );

  injectVoidElement(editor, {
    type: 'button',
    label: String(data.label || 'Button'),
    linkType: data.linkType,
    url: data.url,
    doc: data.doc,
    newTab: data.newTab,
    children: [{ text: '' }],
  } as Parameters<typeof injectVoidElement>[1]);

  ReactEditor.focus(editor);
};

type RichTextButtonToolbarProps = {
  fieldProps?: unknown;
  path?: string;
};

export const RichTextButtonToolbar: React.FC<
  RichTextButtonToolbarProps
> = () => {
  const { user } = useAuth();
  const { code: locale } = useLocale();
  const [initialState, setInitialState] = useState({});
  const { t } = useTranslation(['fields', 'general']);
  const editor = useSlate();
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
  const drawerSlug = useDrawerSlug('rich-text-button');
  const { getDocPreferences } = useDocumentInfo();

  return (
    <Fragment>
      <ElementButton
        className="rich-text-button-toolbar"
        el="div"
        format="button"
        onClick={async () => {
          openModal(drawerSlug);
          const preferences = await getDocPreferences();
          const state = await buildStateFromSchema({
            config,
            data: { label: 'Learn more', linkType: 'custom' },
            fieldSchema,
            locale,
            operation: 'create',
            preferences,
            t,
            user,
          });
          setInitialState(state);
        }}
        tooltip="Insert button"
      >
        Btn
      </ElementButton>
      <ButtonDrawer
        drawerSlug={drawerSlug}
        fieldSchema={fieldSchema}
        handleModalSubmit={(fields) => {
          insertButton(editor, fields);
          closeModal(drawerSlug);
        }}
        initialState={initialState}
        title="Button"
      />
    </Fragment>
  );
};
