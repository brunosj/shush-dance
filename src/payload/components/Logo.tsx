import React from 'react';
import useTheme from '../hooks/useTheme';

const Logo = () => {
  const theme = useTheme();
  const logoSrc =
    theme === 'dark' ? `/media/logo-white.png` : `/media/logo-white.png`;

  return (
    <div className='logo'>
      <img
        src={logoSrc}
        alt='sketchy house'
        style={{ maxHeight: '200px', margin: 'auto' }}
      />
    </div>
  );
};

export default Logo;
