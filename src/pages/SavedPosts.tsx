
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Archive, 
  Loader2, 
  Image as ImageIcon, 
  Trash,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

type SavedPost = {
  id: string;
  platform: string;
  post_text: string;
  image_url: string | null;
  created_at: string;
};

const SavedPosts = () => {
  const { user, loading: authLoading } = useAuth();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }

    const fetchSavedPosts = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('saved_posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Fetched saved posts:', data);
        setSavedPosts(data || []);
      } catch (error) {
        console.error('Error fetching saved posts:', error);
        toast.error('Fehler beim Laden der gespeicherten Posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedPosts();
  }, [user, authLoading, navigate]);

  const handleDeletePost = async (postId: string) => {
    try {
      // Optimistisch UI-Update: Post aus der lokalen Liste entfernen
      setSavedPosts(posts => posts.filter(post => post.id !== postId));
      
      // Durchführen des Löschvorgangs in der Datenbank
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user?.id); // Wichtig: Sicherstellen, dass nur eigene Posts gelöscht werden können
      
      if (error) {
        // Bei Fehler den Post wieder zur Liste hinzufügen und Fehler anzeigen
        console.error('Error deleting post:', error);
        // Erneut Posts laden, um den aktuellen Zustand zu erhalten
        const { data } = await supabase
          .from('saved_posts')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
        
        setSavedPosts(data || []);
        toast.error('Fehler beim Löschen des Posts');
        return;
      }
      
      toast.success('Post erfolgreich gelöscht');
    } catch (error) {
      console.error('Error during post deletion:', error);
      toast.error('Fehler beim Löschen des Posts');
    }
  };

  const handleCopyPost = (postText: string) => {
    navigator.clipboard.writeText(postText);
    toast.success('Post in die Zwischenablage kopiert');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <span className="ml-2">Laden...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 flex items-center justify-center">
          <Archive className="inline-block mr-3 h-8 w-8" />
          Gespeicherte Posts
        </h1>

        {savedPosts.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Du hast noch keine Posts gespeichert.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedPosts.map(post => (
              <Card key={post.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="capitalize">{post.platform}</span>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  {post.post_text ? (
                    <p className="whitespace-pre-wrap mb-4">{post.post_text}</p>
                  ) : (
                    <p className="text-muted-foreground mb-4 italic">Kein Posttext vorhanden</p>
                  )}
                  {post.image_url && (
                    <div className="mt-4">
                      <img 
                        src={post.image_url} 
                        alt="Post" 
                        className="w-full h-auto rounded-md max-h-[300px] object-cover" 
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => handleCopyPost(post.post_text)}
                  >
                    <Copy className="h-4 w-4" />
                    Post kopieren
                  </Button>
                  {post.image_url && (
                    <Button 
                      variant="secondary" 
                      className="flex items-center gap-2"
                      onClick={() => window.open(post.image_url!, '_blank')}
                    >
                      <ImageIcon className="h-4 w-4" /> Bild öffnen
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPosts;
