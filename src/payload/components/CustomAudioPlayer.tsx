import React from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

interface CustomAudioPlayerProps {
  src: string;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ src }) => {
  if (!src) {
    return <p>No audio file available</p>;
  }

  return (
    <AudioPlayer
      src={src}
      autoPlay={false}
      showJumpControls={false}
      customAdditionalControls={[]}
      layout='horizontal'
      style={{
        borderRadius: '0px',
        border: '1px solid #ddd',
        marginTop: '5px',
        boxShadow:
          '0 2px 3px 0 rgba(0, 2, 4, 0.05), 0 10px 4px -8px rgba(0, 2, 4, 0.02',
      }}
    />
  );
};

export default CustomAudioPlayer;
