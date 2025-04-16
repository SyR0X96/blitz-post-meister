
// Add an import for Archive icon
import { Archive } from 'lucide-react';
import { Link } from 'react-router-dom';

// Inside the UserProfile section, add a link to saved posts
<Link 
  to="/saved-posts" 
  className="flex items-center hover:bg-secondary rounded-md p-2 transition-colors"
>
  <Archive className="h-5 w-5 mr-2" />
  Gespeicherte Posts
</Link>
