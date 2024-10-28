import React, { useEffect, useState } from 'react';
import { useFieldType } from 'payload/components/forms';
import CustomAudioPlayer from './CustomAudioPlayer';
import type { Audio } from '../payload-types';
import { Props } from 'payload/components/fields/Relationship';

// Define the shape of the relationship object
interface CustomAudioFieldProps extends Props {
  value: Audio | null; // The audio file object
}

const CustomAudioField: React.FC<CustomAudioFieldProps> = (props) => {
  const { path } = props;

  // Use `useFieldType` to manage the field state and validation
  const { value = null, setValue } = useFieldType<Audio>({
    path,
    validate: (val: Audio | null) =>
      val && val.url ? true : 'Audio file is required',
  });

  const [audioSrc, setAudioSrc] = useState<string>('');

  // Update the audio source when the value changes
  useEffect(() => {
    if (value && value.url) {
      setAudioSrc(value.url);
    }
  }, [value]);

  // Handle case where no audio file is available
  if (!value || !value.url) {
    return <p>No audio file available</p>;
  }

  return (
    <div className='custom-audio-field'>
      <CustomAudioPlayer src={audioSrc} />
    </div>
  );
};

export default CustomAudioField;
