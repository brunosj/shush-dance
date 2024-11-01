'use client';

import Link from 'next/link';
import Image from 'next/image';
import Logo from '../../../../public/logo-black.png';
import localFont from 'next/font/local';
import { useShoppingCart } from 'use-shopping-cart';
import { IoTicketOutline } from 'react-icons/io5';

const logoSrc = '/shush_triple_logo_black.png';
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
      <div className='fixed top-0 w-full z-10 filter-bottom'>
        <div className='py-2 px-3 flex items-center  justify-between'>
          <div className=''>
            <Link href='/' className=''>
              <Image src={logoSrc} alt='SHUSH' width={125} height={150} />
              {/* <div
                className={`${Carbon.className} text-lg lg:text-2xl tracking-[1.2rem]`}
              >
                SHUSH
              </div> */}
            </Link>
          </div>
          {cartCount > 0 && (
            <div className='z-50 group relative'>
              <Link href='/cart' className=''>
                <IoTicketOutline className='w-8 h-8 group-hover:opacity-75' />
                <div className='rounded-full flex justify-center items-center  text-xs bg-black text-pri absolute w-5 h-5 -mt-2 group-hover:opacity-75 -left-1 '>
                  {cartCount}
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* <div className='fixed bottom-0 w-full text-right filter-top z-10 py-2 px-3'>
        <Link href='/' className=''>
          <div
            className={`${Carbon.className} text-lg lg:text-2xl tracking-[1.2rem]`}
          >
            DANCE
          </div>
        </Link>
      </div> */}
    </header>
  );
}
