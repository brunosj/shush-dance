'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useShoppingCart } from 'use-shopping-cart';
import { IoTicketOutline } from 'react-icons/io5';
import { Fade as Hamburger } from 'hamburger-react';
import { menuItems } from '../Menu';

const logoSrc = '/shush_triple_logo_black.png';

export function Header() {
  const { cartCount } = useShoppingCart();
  const [isOpen, setOpen] = useState(false);
  const [logoSize, setLogoSize] = useState({ width: 125, height: 150 });

  const closeMenu = () => setOpen(false);

  const updateLogoSize = () => {
    if (window.innerWidth < 640) {
      setLogoSize({ width: 80, height: 100 });
    } else if (window.innerWidth < 768) {
      setLogoSize({ width: 100, height: 120 });
    } else {
      setLogoSize({ width: 125, height: 150 });
    }
  };

  useEffect(() => {
    updateLogoSize();
    window.addEventListener('resize', updateLogoSize);
    return () => window.removeEventListener('resize', updateLogoSize);
  }, []);

  return (
    <header className='fixed top-0 w-full z-30 filter-top'>
      <div className='relative py-2 px-3 flex items-center z-40'>
        {/* Logo on the left */}
        <div className='flex-shrink-0'>
          <Link href='/' onClick={closeMenu}>
            <Image
              src={logoSrc}
              alt='SHUSH'
              width={logoSize.width}
              height={logoSize.height}
            />
          </Link>
        </div>

        {/* Centered Hamburger */}
        <div className='absolute left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto'>
          <Hamburger toggled={isOpen} toggle={setOpen} size={25} />
        </div>

        {/* Cart Icon on the right */}
        <div className='ml-auto z-40 group relative'>
          <Link href='/cart' onClick={closeMenu}>
            <IoTicketOutline className='w-8 h-8 group-hover:opacity-75' />
            {cartCount > 0 && (
              <div className='rounded-full flex justify-center items-center text-xs bg-black text-pri absolute w-5 h-5 -mt-2 group-hover:opacity-75 -left-1'>
                {cartCount}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <nav className='absolute top-0 left-0 w-full bg-pri shadow-md'>
          <ul className='flex flex-col items-center pb-4 lg:pb-6 pt-12 space-y-1 lg:space-y-2 lg:pt-16'>
            {menuItems.map((item, index) => (
              <li key={index} className=''>
                <Link
                  href={item.href}
                  className='text-sm lg:text-base textHover'
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
