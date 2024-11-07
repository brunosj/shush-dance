'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useShoppingCart } from 'use-shopping-cart';
import { IoTicketOutline } from 'react-icons/io5';
import { Fade as Hamburger } from 'hamburger-react';
import { useState } from 'react';
import { menuItems } from '../Menu';

const logoSrc = '/shush_triple_logo_black.png';

export function Header() {
  const { cartCount } = useShoppingCart();
  const [isOpen, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className='fixed top-0 w-full z-30 filter-bottom'>
      <div className='relative py-2 px-3 flex items-center'>
        {/* Logo on the left */}
        <div className='flex-shrink-0'>
          <Link href='/' onClick={closeMenu}>
            <Image src={logoSrc} alt='SHUSH' width={125} height={150} />
          </Link>
        </div>

        {/* Centered Hamburger */}
        {/* <div className='absolute left-1/2 transform -translate-x-1/2'>
          <Hamburger toggled={isOpen} toggle={setOpen} size={25} />
        </div> */}

        {/* Cart Icon on the right */}
        {cartCount > 0 && (
          <div className='ml-auto z-50 group relative'>
            <Link href='/cart' onClick={closeMenu}>
              <IoTicketOutline className='w-8 h-8 group-hover:opacity-75' />
              <div className='rounded-full flex justify-center items-center text-xs bg-black text-pri absolute w-5 h-5 -mt-2 group-hover:opacity-75 -left-1'>
                {cartCount}
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <nav className='absolute top-full left-0 w-full bg-pri shadow-md'>
          <ul className='flex flex-col items-center py-4'>
            {menuItems.map((item, index) => (
              <li key={index} className='py-2'>
                <Link
                  href={item.href}
                  className='text-lg hover:text-gray-700'
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
