import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Loader2,
  Download,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  profilurl: z.string().min(1, { message: "Profil URL ist erforderlich" }),
  postThema: z.string().min(1, { message: "Post Thema ist erforderlich" }),
  details: z.string().optional(),
  generateImage: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const PostGenerator = () => {
  const { user, loading: authLoading, session } = useAuth();
  const { subscription, remainingPosts, refreshSubscription, isSubscribed } = useSubscription();
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Bitte melde dich an, um Posts zu generieren");
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Check if user has a subscription
  useEffect(() => {
    if (!authLoading && user && !isSubscribed) {
      navigate('/subscriptions');
    }
  }, [user, authLoading, isSubscribed, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profilurl: "",
      postThema: "",
      details: "",
      generateImage: false,
    },
  });

  const platforms = [
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <Linkedin className="h-6 w-6" />,
      webhook:
        "https://grevenmedien.app.n8n.cloud/webhook/b81511aa-f625-46e5-9f73-5d3e80ed5e02",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram className="h-6 w-6" />,
      webhook:
        "https://grevenmedien.app.n8n.cloud/webhook/e831624b-e624-43de-bdf2-2da7db8a049c",
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: <Twitter className="h-6 w-6" />,
      webhook:
        "https://grevenmedien.app.n8n.cloud/webhook/56235c2f-4b09-4250-8232-a2b07e956904",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="h-6 w-6" />,
      webhook:
        "https://grevenmedien.app.n8n.cloud/webhook/ee8e17dc-dafa-4327-8f53-cf96b09e128a",
    },
  ];

  // Function to update post usage in the database
  const updatePostUsage = async () => {
    if (!user || !session) return;
    
    try {
      console.log("Updating post usage count...");
      
      // First get current usage
      const { data: currentUsage, error: fetchError } = await supabase
        .from("user_post_usage")
        .select("id, count")
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (fetchError) {
        console.error("Error fetching post usage:", fetchError);
        return;
      }
      
      if (currentUsage) {
        // Update existing usage record
        const { error: updateError } = await supabase
          .from("user_post_usage")
          .update({ 
            count: currentUsage.count + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", currentUsage.id);
          
        if (updateError) {
          console.error("Error updating post usage:", updateError);
        } else {
          console.log("Post usage updated successfully");
        }
      } else {
        // Create a new usage record if one doesn't exist
        // Set reset date to 30 days from now
        const resetDate = new Date();
        resetDate.setDate(resetDate.getDate() + 30);
        
        const { error: insertError } = await supabase
          .from("user_post_usage")
          .insert({
            user_id: user.id,
            count: 1,
            reset_date: resetDate.toISOString()
          });
          
        if (insertError) {
          console.error("Error creating post usage:", insertError);
        } else {
          console.log("New post usage record created");
        }
      }
      
      // Refresh subscription to update the UI
      refreshSubscription();
      
    } catch (error) {
      console.error("Error in updatePostUsage:", error);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!selectedPlatform) {
      toast.error("Bitte wähle eine Plattform aus");
      return;
    }

    if (remainingPosts <= 0 && remainingPosts !== Infinity) {
      toast.error("Dein monatliches Kontingent ist aufgebraucht");
      return;
    }

    setIsLoading(true);
    setGeneratedImageUrl(null);

    const platform = platforms.find((p) => p.id === selectedPlatform);

    if (!platform) {
      toast.error("Ungültige Plattform ausgewählt");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        profilurl: data.profilurl,
        postThema: data.postThema,
        details: data.details || "",
        ...(data.generateImage ? { generateImage: true } : {}),
      };

      const response = await fetch(platform.webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const rawResponse = await response.json();
      let extractedText = "";
      let imageUrl = null;
      let imageGenerated = false;

      console.log("Raw webhook response:", rawResponse);

      if (Array.isArray(rawResponse) && rawResponse.length > 0) {
        const responseItem = rawResponse[0];

        if (responseItem.message?.content?.result) {
          extractedText = responseItem.message.content.result;
          imageGenerated = responseItem.message.content.imageGenerated || false;
          imageUrl = responseItem.message.content.imageUrl || null;
        }
      } else if (typeof rawResponse === "object") {
        extractedText =
          rawResponse.postText || rawResponse.result || JSON.stringify(rawResponse);
        imageGenerated = rawResponse.imageGenerated || false;
        imageUrl = rawResponse.imageUrl || null;
      } else {
        extractedText = String(rawResponse);
      }

      setGeneratedPost(extractedText);

      if (imageGenerated && imageUrl) {
        setGeneratedImageUrl(imageUrl);
      }

      // Update usage count after successful post generation
      await updatePostUsage();

      const savePost = async () => {
        if (!user || !selectedPlatform) return;
      
        try {
          const { error } = await supabase
            .from('saved_posts')
            .insert({
              user_id: user.id,
              platform: selectedPlatform,
              post_text: generatedPost || '',
              image_url: generatedImageUrl
            });
      
          if (error) throw error;
          
          toast.success('Post wurde gespeichert');
        } catch (error) {
          console.error('Error saving post:', error);
          toast.error('Fehler beim Speichern des Posts');
        }
      };
      
      // Call savePost() right after updatePostUsage() in the onSubmit function
      await savePost();

      setDialogOpen(true);
      form.reset();
      setSelectedPlatform(null);
    } catch (error) {
      console.error("Error generating post:", error);
      toast.error("Fehler beim Generieren des Posts. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    
    window.open(generatedImageUrl, '_blank');
    
    setTimeout(() => {
      fetch(generatedImageUrl)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `social-media-${selectedPlatform}-image.jpg`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          
          toast.success("Bild wird heruntergeladen");
        })
        .catch(err => {
          console.error("Download failed:", err);
          toast.error("Download fehlgeschlagen. Versuchen Sie, das Bild im neuen Tab zu speichern.");
        });
    }, 100);
  };
  
  // If loading authentication state, show spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <span className="ml-2">Laden...</span>
      </div>
    );
  }

  // If not authenticated, don't render the component (useEffect will redirect)
  if (!user || !isSubscribed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center mb-10">
          <Logo className="text-3xl" />
        </div>

        <div className="max-w-3xl mx-auto glass-card p-8 rounded-xl">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Social Media Post Generator
          </h1>
          <p className="text-muted-foreground mb-8 text-center">
            Wähle eine Plattform und gib deine Details ein, um einen professionellen Social Media Post zu generieren.
          </p>

          {/* Subscription Info Alert */}
          <Alert className="mb-6 bg-orange-500/10 border-orange-500">
            <AlertTitle className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" /> 
              Dein aktuelles Abonnement: {subscription?.subscription_plans.name}
            </AlertTitle>
            <AlertDescription className="pl-6">
              {remainingPosts === Infinity ? (
                <>Du hast unbegrenzte Posts in deinem Plan.</>
              ) : (
                <>Du hast noch <span className="font-bold">{remainingPosts}</span> von <span className="font-bold">{subscription?.subscription_plans.monthly_post_limit}</span> Posts in diesem Monat übrig.</>
              )}
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-medium">Plattform wählen</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {platforms.map((platform) => (
                    <div
                      key={platform.id}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer border transition-all ${
                        selectedPlatform === platform.id
                          ? "bg-orange-500/20 border-orange-500"
                          : "bg-secondary border-transparent hover:bg-secondary/80"
                      }`}
                      onClick={() => setSelectedPlatform(platform.id)}
                    >
                      {platform.icon}
                      <span className="mt-2 text-sm">{platform.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="profilurl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webseiten URL</FormLabel>
                    <FormControl>
                      <Input placeholder="www.beispieldomain.de" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL wo Infos zum Post vorhanden sind
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postThema"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Thema</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Digitales Marketing, Neue Produkte, etc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Worum soll es in deinem Post gehen?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zusätzliche Details (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Weitere Informationen oder spezielle Call-to-Actions"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Füge weitere Details oder Call-to-Actions hinzu
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="generateImage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Bild generieren?</FormLabel>
                      <FormDescription>
                        Eine passende Grafik wird automatisch erstellt und mit deinem Post angezeigt.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading || remainingPosts === 0}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generiere Post...
                    </>
                  ) : (
                    "Post generieren"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl w-full h-auto overflow-hidden">
          <DialogHeader>
            <DialogTitle>Dein generierter Social Media Post</DialogTitle>
            <DialogDescription>
              Hier ist dein fertiger Post für {selectedPlatform && platforms.find(p => p.id === selectedPlatform)?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 max-h-[60vh] overflow-auto p-2">
            <div className="bg-secondary/10 p-4 rounded-md overflow-y-auto">
              <p className="whitespace-pre-wrap">{generatedPost || ""}</p>
            </div>

            {generatedImageUrl && (
              <div className="flex flex-col items-center justify-start">
                <img 
                  src={generatedImageUrl} 
                  alt="Generated post image" 
                  className="w-full h-auto rounded-md object-contain max-h-[50vh]" 
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Schließen
            </Button>
            {generatedImageUrl && (
              <Button 
                onClick={handleDownloadImage} 
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Bild herunterladen
              </Button>
            )}
            <Button
              onClick={() => {
                const contentToCopy = generatedPost || "";
                navigator.clipboard.writeText(contentToCopy);
                toast.success("Post in die Zwischenablage kopiert!");
              }}
            >
              Kopieren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostGenerator;
