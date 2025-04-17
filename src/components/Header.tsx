
import { Archive } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserProfile from './UserProfile';

const Header = () => {
  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">GrevenMedien PostGenerator</Link>
        <div className="flex items-center space-x-4">
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link 
                  to="/post-generator" 
                  className="hover:text-primary transition-colors"
                >
                  Post Generator
                </Link>
              </li>
            </ul>
          </nav>
          <UserProfile />
        </div>
      </div>
    </header>
  );
};

export default Header;
