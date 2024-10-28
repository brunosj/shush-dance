import { Field } from 'payload/types';
import AudioSelectField from '../components/AudioField/AudioSelectField';

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
      Field: AudioSelectField,
    },
  },
};

export default audioField;
