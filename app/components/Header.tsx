'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Scale, GitCompare } from 'lucide-react';
import Image from 'next/image';

const Header: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { path: '/', label: 'Home', icon: null },
    { path: '/generate', label: 'Generate Contract', icon: FileText },
    { path: '/review', label: 'Evaluate Contract', icon: Scale },
    { path: '/compare', label: 'Compare Contracts', icon: GitCompare },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="https://www.aganitha.ai/wp-content/uploads/2023/05/aganitha-logo.png"
                alt="Aganitha Logo"
                width={128}
                height={128}
                className="object-contain max-h-10 w-auto"
                quality={100}
                priority
              />
              {/* <div className="text-xl font-bold text-blue-900">ARC Documents</div> */}
            </Link>
          </div>
          
          <nav className="flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;