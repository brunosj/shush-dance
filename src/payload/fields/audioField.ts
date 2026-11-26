import { Field } from 'payload';

const audioField: Field = {
  name: 'audioFile',
  label: 'Audio Preview',
  type: 'relationship',
  relationTo: 'audio',
  access: {
    update: () => true,
  },
  admin: {
    description: 'Select the associated audio file.',
    components: {
      Field: './components/AudioField/AudioSelectField#default',
    },
  },
};

export default audioField;
