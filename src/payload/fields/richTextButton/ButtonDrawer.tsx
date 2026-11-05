/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — bundled in Payload admin; peer deps not in app tsconfig
'use client';

import { Drawer } from 'payload/components/elements';
import {
  fieldTypes,
  Form,
  FormSubmit,
  RenderFields,
} from 'payload/components/forms';
import { useHotkey } from 'payload/components/hooks';
import { useEditDepth } from 'payload/components/utilities';
import type { Field } from 'payload/types';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

type ButtonDrawerProps = {
  drawerSlug: string;
  fieldSchema: Field[];
  handleModalSubmit: (fields: Record<string, unknown>) => void;
  initialState: Record<string, unknown>;
  title?: string;
};

export const ButtonDrawer: React.FC<ButtonDrawerProps> = ({
  drawerSlug,
  fieldSchema,
  handleModalSubmit,
  initialState,
  title = 'Button',
}) => {
  return (
    <Drawer
      className="rich-text-link-edit-modal"
      slug={drawerSlug}
      title={title}
    >
      <Form
        fields={fieldSchema}
        initialState={initialState}
        onSubmit={handleModalSubmit}
      >
        <RenderFields
          fieldSchema={fieldSchema}
          fieldTypes={fieldTypes}
          forceRender
          readOnly={false}
        />
        <ButtonDrawerSubmit />
      </Form>
    </Drawer>
  );
};

const ButtonDrawerSubmit: React.FC = () => {
  const { t } = useTranslation(['fields', 'general']);
  const ref = useRef<HTMLButtonElement>(null);
  const editDepth = useEditDepth();

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    e.preventDefault();
    e.stopPropagation();
    ref.current?.click();
  });

  return <FormSubmit ref={ref}>{t('general:submit')}</FormSubmit>;
};
