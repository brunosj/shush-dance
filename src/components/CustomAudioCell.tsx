// components/CustomAudioCell.tsx
import React from 'react';
import CustomAudioPlayer from './CustomAudioPlayer';

interface CustomAudioCellProps {
  data: {
    filename?: string; // Filename or path to the audio file
    url?: string; // URL to the audio file if available
  };
}

const CustomAudioCell: React.FC<CustomAudioCellProps> = ({ data }) => {
  // Construct the src URL based on filename or URL
  const src = data?.url || `/media/audio/${data?.filename || ''}`;

  return <CustomAudioPlayer src={src} />;
};

export default CustomAudioCell;
