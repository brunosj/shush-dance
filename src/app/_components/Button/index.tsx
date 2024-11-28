import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  href?: string;
  target?: string;
  label: string;
  textStyles?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  href,
  target = '',
  label,
  textStyles = 'text-sm lg:text-base',
  onClick,
  disabled = false,
}) => {
  return (
    <>
      {onClick ? (
        <button
          onClick={onClick}
          className={`lowercase py-1 px-3 bg-black text-pri hover:bg-darkGray duration-200 ease-in-out ${textStyles} `}
          disabled={disabled}
        >
          {label}
        </button>
      ) : disabled ? (
        <span
          className={`lowercase py-1 px-3 bg-black text-pri duration-200 ease-in-out ${textStyles} opacity-50 cursor-not-allowed`}
        >
          {label}
        </span>
      ) : (
        <Link href={href || '#'} target={target} passHref>
          <span
            className={`lowercase py-1 px-3 bg-black text-pri hover:bg-darkGray duration-200 ease-in-out ${textStyles}`}
          >
            {label}
          </span>
        </Link>
      )}
    </>
  );
};

export default Button;
