
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import UserProfile from './UserProfile';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center">
          <Logo className="text-xl" />
        </Link>

        <div className="flex items-center gap-4">
          <UserProfile />
        </div>
      </div>
    </header>
  );
};

export default Header;
