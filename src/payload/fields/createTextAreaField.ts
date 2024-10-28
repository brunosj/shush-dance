import { Field } from 'payload/types';

type TextFieldOptions = {
  label: string;
};

export const createTextAreaField = ({ label }: TextFieldOptions): Field => ({
  name: label.toLowerCase().replace(/\s+/g, '_'),
  type: 'textarea',
  label: label,
  localized: true,
  required: true,
  admin: {
    placeholder: `Enter ${label.toLowerCase()}`,
  },
});
