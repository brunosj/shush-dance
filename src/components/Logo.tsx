import React from 'react';
import useTheme from '../hooks/useTheme';

const Logo = () => {
  const theme = useTheme();
  const logoSrc =
    theme === 'dark'
      ? `/shush_triple_logo_white.png`
      : `/shush_triple_logo_black.png`;

  return (
    <div className='logo'>
      <img
        src={logoSrc}
        alt='SHUSH'
        style={{ maxHeight: '200px', margin: 'auto' }}
      />
    </div>
  );
};

export default Logo;
