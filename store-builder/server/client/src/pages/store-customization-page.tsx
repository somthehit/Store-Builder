import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Palette, Type, Layout, Upload, Eye, Save } from "lucide-react";
import { useParams } from "wouter";

const customizationSchema = z.object({
  primaryColor: z.string().min(1, "Primary color is required"),
  secondaryColor: z.string().min(1, "Secondary color is required"),
  fontFamily: z.string().min(1, "Font family is required"),
  theme: z.enum(["modern", "minimal", "classic", "trendy"]),
  logo: z.string().optional(),
  customCss: z.string().optional(),
});

type CustomizationForm = z.infer<typeof customizationSchema>;

const fontOptions = [
  { value: "Inter", label: "Inter - Modern & Clean" },
  { value: "Roboto", label: "Roboto - Professional" },
  { value: "Poppins", label: "Poppins - Friendly" },
  { value: "Montserrat", label: "Montserrat - Elegant" },
  { value: "Open Sans", label: "Open Sans - Readable" },
  { value: "Lato", label: "Lato - Corporate" },
];

const themeOptions = [
  { value: "modern", label: "Modern", description: "Clean lines, bold colors, minimalist design" },
  { value: "minimal", label: "Minimal", description: "Simple, spacious, focus on content" },
  { value: "classic", label: "Classic", description: "Traditional, professional, timeless" },
  { value: "trendy", label: "Trendy", description: "Contemporary, stylish, eye-catching" },
];

const colorPresets = [
  { name: "Blue Ocean", primary: "#3B82F6", secondary: "#1E40AF" },
  { name: "Green Nature", primary: "#10B981", secondary: "#059669" },
  { name: "Purple Royal", primary: "#8B5CF6", secondary: "#7C3AED" },
  { name: "Orange Sunset", primary: "#F59E0B", secondary: "#D97706" },
  { name: "Red Passion", primary: "#EF4444", secondary: "#DC2626" },
  { name: "Pink Bloom", primary: "#EC4899", secondary: "#DB2777" },
];

export default function StoreCustomizationPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = useState(false);

  const { data: store, isLoading } = useQuery({
    queryKey: ["/api/stores", storeId],
    enabled: !!storeId,
  });

  const form = useForm<CustomizationForm>({
    resolver: zodResolver(customizationSchema),
    defaultValues: {
      primaryColor: store?.primaryColor || "#3B82F6",
      secondaryColor: store?.secondaryColor || "#1E40AF",
      fontFamily: store?.fontFamily || "Inter",
      theme: store?.theme || "modern",
      logo: store?.logo || "",
      customCss: store?.customCss || "",
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: async (data: CustomizationForm) => {
      const res = await apiRequest("PUT", `/api/stores/${storeId}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Store Updated Successfully!",
        description: "Your store customization has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stores", storeId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CustomizationForm) => {
    updateStoreMutation.mutate(data);
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    form.setValue("primaryColor", preset.primary);
    form.setValue("secondaryColor", preset.secondary);
  };

  const currentValues = form.watch();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Store Customization</h1>
          <p className="text-gray-600 mt-2">Customize your store's appearance and branding</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Customization Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Customize Your Store
                </CardTitle>
                <CardDescription>
                  Make your store unique with colors, fonts, and themes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Tabs defaultValue="colors" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="colors">Colors</TabsTrigger>
                        <TabsTrigger value="fonts">Fonts</TabsTrigger>
                        <TabsTrigger value="theme">Theme</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </TabsList>

                      {/* Colors Tab */}
                      <TabsContent value="colors" className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Color Scheme</h3>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="primaryColor"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Primary Color</FormLabel>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input type="color" className="w-16 h-10" {...field} />
                                    </FormControl>
                                    <FormControl>
                                      <Input placeholder="#3B82F6" {...field} />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="secondaryColor"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Secondary Color</FormLabel>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input type="color" className="w-16 h-10" {...field} />
                                    </FormControl>
                                    <FormControl>
                                      <Input placeholder="#1E40AF" {...field} />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Quick Color Presets</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {colorPresets.map((preset) => (
                                <Button
                                  key={preset.name}
                                  type="button"
                                  variant="outline"
                                  className="p-3 h-auto flex items-center gap-2 hover:bg-gray-50"
                                  onClick={() => applyColorPreset(preset)}
                                >
                                  <div className="flex gap-1">
                                    <div 
                                      className="w-4 h-4 rounded-full border" 
                                      style={{ backgroundColor: preset.primary }}
                                    />
                                    <div 
                                      className="w-4 h-4 rounded-full border" 
                                      style={{ backgroundColor: preset.secondary }}
                                    />
                                  </div>
                                  <span className="text-xs">{preset.name}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Fonts Tab */}
                      <TabsContent value="fonts" className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Typography</h3>
                          
                          <FormField
                            control={form.control}
                            name="fontFamily"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Font Family</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a font" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {fontOptions.map((font) => (
                                      <SelectItem key={font.value} value={font.value}>
                                        <div style={{ fontFamily: font.value }}>
                                          {font.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="p-4 border rounded-lg bg-gray-50">
                            <h4 className="font-medium mb-2">Font Preview</h4>
                            <div style={{ fontFamily: currentValues.fontFamily }}>
                              <h2 className="text-2xl font-bold mb-2">Your Store Name</h2>
                              <p className="text-gray-600 mb-2">
                                This is how your store content will look with the selected font.
                              </p>
                              <Button size="sm" style={{ fontFamily: currentValues.fontFamily }}>
                                Sample Button
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Theme Tab */}
                      <TabsContent value="theme" className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Store Theme</h3>
                          
                          <FormField
                            control={form.control}
                            name="theme"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="grid md:grid-cols-2 gap-4">
                                    {themeOptions.map((theme) => (
                                      <div
                                        key={theme.value}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                          field.value === theme.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                        onClick={() => field.onChange(theme.value)}
                                      >
                                        <div className="flex items-center gap-2 mb-2">
                                          <Layout className="w-4 h-4" />
                                          <h4 className="font-semibold">{theme.label}</h4>
                                          {field.value === theme.value && (
                                            <Badge variant="secondary">Selected</Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600">{theme.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>

                      {/* Advanced Tab */}
                      <TabsContent value="advanced" className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Advanced Customization</h3>
                          
                          <FormField
                            control={form.control}
                            name="logo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Logo URL</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="https://example.com/logo.png" 
                                    {...field} 
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="customCss"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custom CSS</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="/* Add your custom CSS here */
.store-header {
  background: linear-gradient(to right, #3B82F6, #1E40AF);
}"
                                    rows={10}
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex gap-4">
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={updateStoreMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateStoreMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setPreviewMode(!previewMode)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {previewMode ? "Hide Preview" : "Preview"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your store will look
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg p-4 space-y-4 min-h-[400px]"
                  style={{ 
                    fontFamily: currentValues.fontFamily,
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* Store Header */}
                  <div 
                    className="p-4 rounded-lg text-white"
                    style={{ 
                      background: `linear-gradient(135deg, ${currentValues.primaryColor}, ${currentValues.secondaryColor})`
                    }}
                  >
                    <h2 className="text-xl font-bold">Your Store</h2>
                    <p className="text-sm opacity-90">Welcome to our store</p>
                  </div>

                  {/* Sample Product */}
                  <div className="border rounded-lg p-3">
                    <div className="w-full h-20 bg-gray-200 rounded mb-2"></div>
                    <h3 className="font-semibold">Sample Product</h3>
                    <p className="text-sm text-gray-600">Rs. 1,500</p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      style={{ backgroundColor: currentValues.primaryColor }}
                    >
                      Add to Cart
                    </Button>
                  </div>

                  {/* Sample Content */}
                  <div className="space-y-2">
                    <h4 className="font-medium">About Us</h4>
                    <p className="text-sm text-gray-600">
                      This is how your store content will appear with the selected customization.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}