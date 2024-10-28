'use client';

import Link from 'next/link';
import Image from 'next/image';
import Logo from '../../../../public/logo-black.png';
import localFont from 'next/font/local';
import { useShoppingCart } from 'use-shopping-cart';
import { IoTicketOutline } from 'react-icons/io5';

const Carbon = localFont({
  src: '../../../app/_fonts/Carbon.ttf',
  display: 'swap',
  variable: '--editorial',
  weight: '1 1000',
});

export function Header() {
  const { cartCount } = useShoppingCart();

  return (
    <header>
      {cartCount > 0 && (
        <div className='fixed right-3 -top-3 z-50'>
          <Link href='/cart' className='relative px-3'>
            <IoTicketOutline className='w-8 h-8 textHover' />
            <div className='rounded-full flex justify-center items-center bg-black text-xs text-white absolute w-5 h-5 -bottom-7 -left-2'>
              {cartCount}
            </div>
          </Link>
        </div>
      )}
      <div className='fixed top-0 w-full z-10 backdrop-blur-sm'>
        <Link href='/' className=''>
          <div
            className={`${Carbon.className} py-2 px-3 text-lg lg:text-2xl tracking-[1.2rem]`}
          >
            SHUSH
          </div>
        </Link>
      </div>

      <div className='fixed bottom-0 w-full text-right backdrop-blur-sm z-10'>
        <Link href='/' className=''>
          <div
            className={`${Carbon.className} text-lg lg:text-2xl p-2 tracking-[1.2rem]`}
          >
            DANCE
          </div>
        </Link>
      </div>
    </header>
  );
}
