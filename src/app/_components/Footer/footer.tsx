'use client';

import Link from 'next/link';
import { footerItems } from '../Menu';

const logoSrc = '/shush_triple_logo_black.png';

export function Footer() {
  return (
    <footer className='fixed bottom-0 w-full z-30 filter-bottom bg-pri py-2'>
      <nav className='px-3 flex m'>
        <div className='ml-auto'>
          <ul className='flex items-center space-x-12'>
            {footerItems.map((item, index) => (
              <li key={index} className=''>
                <Link
                  href={item.href}
                  className='text-xs lg:text-sm textHover '
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </footer>
  );
}
