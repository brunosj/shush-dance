import React from 'react';
import useTheme from '../hooks/useTheme';

const Icon = () => {
  const theme = useTheme();
  const logoSrc =
    theme === 'dark'
      ? `/shush_triple_logo_white.png`
      : `/shush_triple_logo_black.png`;

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
