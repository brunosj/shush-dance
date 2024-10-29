import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  href?: string;
  target?: string;
  label: string;
  textStyles?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  href,
  target = '',
  label,
  textStyles = 'text-sm lg:text-base',
  onClick,
}) => {
  return (
    <>
      {onClick ? (
        <button
          onClick={onClick}
          className={`lowercase py-1 px-2 bg-black text-pri hover:bg-opacity-75 duration-200 ease-in-out ${textStyles}`}
        >
          {label}
        </button>
      ) : (
        <Link href={href || '#'} target={target}>
          <span
            className={`lowercase py-1 px-2 bg-black text-pri hover:bg-opacity-75 duration-200 ease-in-out ${textStyles}`}
          >
            {label}
          </span>
        </Link>
      )}
    </>
  );
};

export default Button;
