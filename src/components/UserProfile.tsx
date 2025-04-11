
import React, { useState } from 'react';
import { LogOut, User, WifiOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';

const UserProfile: React.FC = () => {
  const { user, signOut, loading, connectionError } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return <div className="h-9 w-9 rounded-full bg-secondary animate-pulse"></div>;
  }

  // Show connection error indicator
  if (connectionError) {
    return (
      <Button variant="outline" className="text-destructive flex items-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="hidden sm:inline">Verbindungsfehler</span>
      </Button>
    );
  }

  if (!user) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          Anmelden
        </Button>
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 rounded-full p-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white uppercase">
              {user.email?.charAt(0)}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="p-2 text-sm font-medium text-foreground truncate">
            {user.email}
          </div>
          <DropdownMenuItem 
            onClick={() => navigate('/post-generator')}
            className="cursor-pointer"
          >
            Post Generator
          </DropdownMenuItem>
          <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" /> Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default UserProfile;
