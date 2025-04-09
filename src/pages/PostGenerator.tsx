
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Loader2 
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
import Logo from "@/components/Logo";

// Schema for form validation
const formSchema = z.object({
  profilurl: z.string().min(1, { message: "Profil URL ist erforderlich" }),
  postThema: z.string().min(1, { message: "Post Thema ist erforderlich" }),
  details: z.string().optional(),
  generateImage: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const PostGenerator = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profilurl: "",
      postThema: "",
      details: "",
      generateImage: false,
    },
  });

  // Platform selection options with their webhooks
  const platforms = [
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <Linkedin className="h-6 w-6" />,
      webhook: "https://grevenmedien.app.n8n.cloud/webhook/b81511aa-f625-46e5-9f73-5d3e80ed5e02"
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram className="h-6 w-6" />,
      webhook: "https://grevenmedien.app.n8n.cloud/webhook/e831624b-e624-43de-bdf2-2da7db8a049c"
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: <Twitter className="h-6 w-6" />,
      webhook: "https://grevenmedien.app.n8n.cloud/webhook/56235c2f-4b09-4250-8232-a2b07e956904"
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="h-6 w-6" />,
      webhook: "https://grevenmedien.app.n8n.cloud/webhook/ee8e17dc-dafa-4327-8f53-cf96b09e128a"
    }
  ];

  const onSubmit = async (data: FormValues) => {
    if (!selectedPlatform) {
      toast.error("Bitte wähle eine Plattform aus");
      return;
    }

    setIsLoading(true);
    setGeneratedImageUrl(null); // Reset image URL on new submission

    const platform = platforms.find(p => p.id === selectedPlatform);
    
    if (!platform) {
      toast.error("Ungültige Plattform ausgewählt");
      setIsLoading(false);
      return;
    }

    try {
      // Prepare payload - only include generateImage if it's true
      const payload = {
        profilurl: data.profilurl,
        postThema: data.postThema,
        details: data.details || "",
        ...(data.generateImage ? { generateImage: true } : {})
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

      // Parse the response, which might be complex JSON with nested data
      const rawResponse = await response.json();
      
      // Handle various response formats
      let extractedText = "";
      let imageUrl = null;
      let imageGenerated = false;
      
      console.log("Raw webhook response:", rawResponse);
      
      // Try to handle the nested response structure we received
      if (Array.isArray(rawResponse) && rawResponse.length > 0) {
        const responseItem = rawResponse[0];
        
        if (responseItem.message?.content?.result) {
          // Extract text from the nested structure
          extractedText = responseItem.message.content.result;
          imageGenerated = responseItem.message.content.imageGenerated || false;
          imageUrl = responseItem.message.content.imageUrl || null;
        } 
      } else if (typeof rawResponse === 'object') {
        // Try direct access for simpler responses
        extractedText = rawResponse.postText || rawResponse.result || JSON.stringify(rawResponse);
        imageGenerated = rawResponse.imageGenerated || false;
        imageUrl = rawResponse.imageUrl || null;
      } else {
        // Fallback for plain text
        extractedText = String(rawResponse);
      }
      
      setGeneratedPost(extractedText);
      
      // Handle image if available
      if (imageGenerated && imageUrl) {
        setGeneratedImageUrl(imageUrl);
      }

      setDialogOpen(true);
      
      // Reset form
      form.reset();
      setSelectedPlatform(null);
      
    } catch (error) {
      console.error("Error generating post:", error);
      toast.error("Fehler beim Generieren des Posts. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Platform Selection */}
              <div className="space-y-4">
                <label className="text-sm font-medium">
                  Plattform wählen
                </label>
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

              {/* Profile URL */}
              <FormField
                control={form.control}
                name="profilurl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profil URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.linkedin.com/in/username" {...field} />
                    </FormControl>
                    <FormDescription>
                      Deine Profil-URL auf der ausgewählten Plattform
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Post Topic */}
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

              {/* Additional Details */}
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

              {/* Generate Image Checkbox */}
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
                      <FormLabel>
                        Soll ein Foto für den Post generiert werden?
                      </FormLabel>
                      <FormDescription>
                        Eine passende Grafik wird automatisch erstellt und mit deinem Post angezeigt.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={isLoading}
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

      {/* Result Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dein generierter Social Media Post</DialogTitle>
            <DialogDescription>
              Hier ist dein fertiger Post für {selectedPlatform && platforms.find(p => p.id === selectedPlatform)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-secondary/50 rounded-md whitespace-pre-wrap">
            {generatedPost}
          </div>
          
          {/* Display image if available */}
          {generatedImageUrl && (
            <div className="mt-4">
              <img 
                src={generatedImageUrl} 
                alt="Generated post image" 
                className="max-w-full h-auto rounded-md object-cover" 
              />
            </div>
          )}
          
          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Schließen
            </Button>
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
