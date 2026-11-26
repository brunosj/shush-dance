import { Field } from 'payload';

export function createMediaField(
  name = 'image',
  {
    label = 'Image',
    required = true,
    description,
  }: {
    label?: string;
    required?: boolean;
    description?: string;
  } = {},
): Field {
  return {
    name: name,
    type: 'upload',
    relationTo: 'media',
    label: label,
    admin: {
      description,
    },
    required: required,
  };
}
