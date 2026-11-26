import { Field } from 'payload';

type TextFieldOptions = {
  label: string;
};

export const createTextField = ({ label }: TextFieldOptions): Field => ({
  name: label.toLowerCase().replace(/\s+/g, '_'),
  type: 'text',
  label: label,
  required: true,
  admin: {
    placeholder: `Enter ${label.toLowerCase()}`,
  },
});
