import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Archive, 
  Loader2, 
  Image as ImageIcon, 
  Trash,
  Copy,
  Filter,
  Tag,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

type SavedPost = {
  id: string;
  platform: string;
  post_text: string;
  image_url: string | null;
  created_at: string;
  tags: string[] | null;
};

type FilterFormValues = {
  platform: string;
  searchText: string;
};

const SavedPosts = () => {
  const { user, loading: authLoading } = useAuth();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<SavedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const filterForm = useForm<FilterFormValues>({
    defaultValues: {
      platform: '',
      searchText: '',
    },
  });

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
        
        const postsWithTags = data?.map(post => ({
          ...post,
          tags: post.tags || []
        })) || [];
        
        setSavedPosts(postsWithTags);
        setFilteredPosts(postsWithTags);
        
        // Extract unique platforms
        const uniquePlatforms = [...new Set(postsWithTags.map(post => post.platform))];
        setPlatforms(uniquePlatforms);
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
      setFilteredPosts(posts => posts.filter(post => post.id !== postId));
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
  
  const applyFilters = (values: FilterFormValues) => {
    let filtered = [...savedPosts];
    
    if (values.platform) {
      filtered = filtered.filter(post => post.platform === values.platform);
    }
    
    if (values.searchText) {
      const searchLower = values.searchText.toLowerCase();
      filtered = filtered.filter(post => 
        post.post_text?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredPosts(filtered);
  };
  
  const resetFilters = () => {
    filterForm.reset({
      platform: '',
      searchText: '',
    });
    setFilteredPosts(savedPosts);
  };
  
  const handleAddTag = async (postId: string) => {
    if (!tagInput.trim()) return;
    
    const post = savedPosts.find(p => p.id === postId);
    if (!post) return;
    
    const tags = post.tags || [];
    if (tags.includes(tagInput.trim())) {
      toast.error('Tag existiert bereits');
      return;
    }
    
    const updatedTags = [...tags, tagInput.trim()];
    
    try {
      const { error } = await supabase
        .from('saved_posts')
        .update({ tags: updatedTags })
        .eq('id', postId);
        
      if (error) throw error;
      
      setSavedPosts(posts => posts.map(p => 
        p.id === postId ? { ...p, tags: updatedTags } : p
      ));
      setFilteredPosts(posts => posts.map(p => 
        p.id === postId ? { ...p, tags: updatedTags } : p
      ));
      
      setTagInput('');
      toast.success('Tag hinzugefügt');
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Fehler beim Hinzufügen des Tags');
    }
  };
  
  const handleRemoveTag = async (postId: string, tagToRemove: string) => {
    const post = savedPosts.find(p => p.id === postId);
    if (!post || !post.tags) return;
    
    const updatedTags = post.tags.filter(tag => tag !== tagToRemove);
    
    try {
      const { error } = await supabase
        .from('saved_posts')
        .update({ tags: updatedTags })
        .eq('id', postId);
        
      if (error) throw error;
      
      setSavedPosts(posts => posts.map(p => 
        p.id === postId ? { ...p, tags: updatedTags } : p
      ));
      setFilteredPosts(posts => posts.map(p => 
        p.id === postId ? { ...p, tags: updatedTags } : p
      ));
      
      toast.success('Tag entfernt');
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Fehler beim Entfernen des Tags');
    }
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
        
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Filter className="mr-2 h-5 w-5" /> Filter
          </h2>
          
          <Form {...filterForm}>
            <form onSubmit={filterForm.handleSubmit(applyFilters)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={filterForm.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plattform</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Alle Plattformen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Alle Plattformen</SelectItem>
                        {platforms.map(platform => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={filterForm.control}
                name="searchText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suche im Text</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nach Textinhalt suchen..."
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1">Filter anwenden</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetFilters}
                  className="flex-1"
                >
                  Zurücksetzen
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center text-muted-foreground">
            {savedPosts.length === 0 
              ? 'Du hast noch keine Posts gespeichert.' 
              : 'Keine Posts entsprechen den Filterkriterien.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
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
                  
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.tags?.map((tag) => (
                        <div 
                          key={`${post.id}-${tag}`} 
                          className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full flex items-center"
                        >
                          <span>{tag}</span>
                          <button 
                            className="ml-1 hover:text-destructive"
                            onClick={() => handleRemoveTag(post.id, tag)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {editingTags === post.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Neuer Tag..."
                          className="text-sm h-8"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag(post.id);
                            }
                          }}
                        />
                        <Button 
                          size="sm" 
                          onClick={() => handleAddTag(post.id)}
                          variant="secondary"
                        >
                          Hinzufügen
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingTags(null);
                            setTagInput('');
                          }}
                        >
                          Fertig
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs"
                        onClick={() => setEditingTags(post.id)}
                      >
                        <Tag className="h-3 w-3" />
                        <Plus className="h-3 w-3" />
                        Tag hinzufügen
                      </Button>
                    )}
                  </div>
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
