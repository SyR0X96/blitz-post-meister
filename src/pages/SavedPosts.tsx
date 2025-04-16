
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
  Trash 
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
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setSavedPosts(posts => posts.filter(post => post.id !== postId));
      toast.success('Post erfolgreich gelöscht');
    } catch (error) {
      console.error('Error deleting post:', error);
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
        <h1 className="text-3xl font-bold text-center mb-8">
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
                    {post.platform}
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
                  <p className="whitespace-pre-wrap">{post.post_text}</p>
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
                    onClick={() => handleCopyPost(post.post_text)}
                  >
                    Post kopieren
                  </Button>
                  {post.image_url && (
                    <Button 
                      variant="secondary" 
                      onClick={() => window.open(post.image_url!, '_blank')}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" /> Bild öffnen
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

