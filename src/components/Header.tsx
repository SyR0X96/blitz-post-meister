
import { Archive } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">BlitzPostMeister</Link>
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
            <li>
              <Link 
                to="/saved-posts" 
                className="flex items-center hover:bg-secondary rounded-md p-2 transition-colors"
              >
                <Archive className="h-5 w-5 mr-2" />
                Gespeicherte Posts
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
