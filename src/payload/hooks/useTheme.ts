import { useEffect, useState } from 'react';

const getCurrentTheme = () => {
  return document.documentElement.getAttribute('data-theme') || 'light';
};

const useTheme = () => {
  const [theme, setTheme] = useState(getCurrentTheme());

  useEffect(() => {
    const updateTheme = () => {
      setTheme(getCurrentTheme());
    };

    // Set initial theme
    updateTheme();

    // Add an event listener for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Clean up the observer on component unmount
    return () => observer.disconnect();
  }, []);

  return theme;
};

export default useTheme;
