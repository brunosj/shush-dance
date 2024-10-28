import React from 'react';
import useTheme from '../hooks/useTheme';

const Icon = () => {
  const theme = useTheme();
  const logoSrc =
    theme === 'dark' ? `/media/logo-white.png` : `/media/logo-white.png`;

  return (
    <div className='icon'>
      <img
        src={logoSrc}
        alt='sketchy house'
        style={{ maxHeight: '15px', margin: 'auto' }}
      />
    </div>
  );
};

export default Icon;
