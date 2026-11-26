'use client';

import { FieldLabel, useField } from '@payloadcms/ui';
import type { RelationshipFieldClientComponent } from 'payload';
import React, { useEffect, useState } from 'react';

import type { Audio } from '../../payload-types';
import CustomAudioPlayer from '../CustomAudioPlayer';

const baseClass = 'custom-audio-select';

const AudioSelectField: RelationshipFieldClientComponent = (props) => {
  const { path, field } = props;
  const { value = '', setValue } = useField<string>({ path });
  const label = field?.label;
  const required = field?.required;

  const [audioFile, setAudioFile] = useState<Audio | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!value) {
      setAudioFile(null);
      return;
    }

    const fetchAudio = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/audio/${value}`);
        const data = (await response.json()) as Audio;
        setAudioFile(data);
      } catch (error) {
        console.error('Error fetching audio file:', error);
        setAudioFile(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAudio();
  }, [value]);

  return (
    <div className={baseClass}>
      <FieldLabel label={label} required={required} />
      <select
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
        className={`${baseClass}__select`}
      >
        <option value="">Select an audio file</option>
      </select>
      {isLoading && <p>Loading preview...</p>}
      {audioFile?.url && <CustomAudioPlayer src={audioFile.url} />}
    </div>
  );
};

export default AudioSelectField;