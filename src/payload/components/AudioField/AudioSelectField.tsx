import React, { useEffect, useState } from 'react';
import { useField } from 'payload/components/forms';
import { Label } from 'payload/components/forms';
import { Props } from 'payload/components/fields/Relationship';
import CustomAudioPlayer from '../CustomAudioPlayer';
import type { Audio } from '../../payload-types';

const baseClass = 'custom-audio-select';

const AudioSelectField: React.FC<Props> = (props) => {
  const { path, label, required } = props;
  const { value = '', setValue } = useField<string>({
    path,
    validate: (val: string, { siblingData }) => {
      // Allow audioFile to be empty if audioUpload is present
      if (!val && siblingData.audioUpload) {
        return true;
      }
      return val ? true : 'Please select a valid audio file';
    },
  });

  const [audioSrc, setAudioSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAudioFile = async () => {
      if (!value) {
        console.log('No audio file ID provided.');
        return;
      }

      console.log('Fetching audio file for ID:', value);

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/audio/${value}`);

        console.log('Fetch Response Status:', response.status);

        if (!response.ok) {
          throw new Error('Failed to fetch the selected audio file');
        }

        const audio: Audio = await response.json();
        console.log('Fetched Audio Data:', audio);

        const resolvedUrl = audio.url || `/api/audio/${audio.filename}`;
        console.log('Resolved Audio URL:', resolvedUrl);

        setAudioSrc(resolvedUrl);
        setValue(audio.id);
      } catch (err) {
        console.error('Error fetching audio file:', err);
        setError(
          'Error fetching the selected audio file. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAudioFile();
  }, [value, setValue]);

  if (loading) {
    console.log('Loading audio file...');
    return <p>Loading audio file...</p>;
  }

  if (error) {
    console.log('Error encountered:', error);
    return <p>{error}</p>;
  }

  return (
    <div className={baseClass} style={{ paddingBottom: '1.5rem' }}>
      <Label htmlFor={path} label={label} required={required} />
      <CustomAudioPlayer key={audioSrc} src={audioSrc} />
    </div>
  );
};

export default AudioSelectField;
