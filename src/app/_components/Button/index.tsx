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
          className={` py-3 px-4 lg:px-6 hover:bg-black hover:text-pri text-black border-black border-[1px] bg-transparent duration-200 ease-in-out ${textStyles} `}
          disabled={disabled}
        >
          {label}
        </button>
      ) : disabled ? (
        <span
          className={` py-3 px-4 lg:px-6 hover:bg-black bg-transparent hover:text-pri text-black border-black border-[1px] duration-200 ease-in-out ${textStyles} opacity-50 cursor-not-allowed`}
        >
          {label}
        </span>
      ) : (
        <Link href={href || '#'} target={target} passHref>
          <span
            className={` py-3 px-4 lg:px-6 hover:bg-black hover:text-pri text-black border-black border-[1px] bg-transparent duration-200 ease-in-out ${textStyles}`}
          >
            {label}
          </span>
        </Link>
      )}
    </>
  );
};

export default Button;
