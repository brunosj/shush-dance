import React from 'react';
import useTheme from '../hooks/useTheme';

const Icon = () => {
  const theme = useTheme();
  const logoSrc = theme === 'dark' ? `/logo-white.png` : `/logo-white.png`;

  return (
    <div className='icon'>
      <img
        src={logoSrc}
        alt='SHUSH'
        style={{ maxHeight: '15px', margin: 'auto' }}
      />
    </div>
  );
};

export default Icon;
