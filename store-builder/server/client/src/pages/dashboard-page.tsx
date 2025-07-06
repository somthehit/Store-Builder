import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStoreSchema, type Store } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { 
  Plus, 
  Store as StoreIcon, 
  ExternalLink, 
  Settings, 
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Loader2
} from "lucide-react";
import { z } from "zod";

const createStoreSchema = insertStoreSchema.pick({ name: true, subdomain: true, description: true });
type CreateStoreForm = z.infer<typeof createStoreSchema>;

export default function DashboardPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: stores, isLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    enabled: !!user,
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: CreateStoreForm) => {
      const res = await apiRequest("POST", "/api/stores", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Store created successfully",
        description: "Your new store is ready to go!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create store",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createStoreForm = useForm<CreateStoreForm>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      description: "",
    },
  });

  const onCreateStore = async (data: CreateStoreForm) => {
    await createStoreMutation.mutateAsync(data);
    createStoreForm.reset();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
              <p className="text-blue-100 text-lg">Manage your stores and grow your business</p>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <StoreIcon className="w-5 h-5" />
                  <span className="text-sm">{stores?.length || 0} Stores</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm">Growing</span>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <StoreIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Store
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Store</DialogTitle>
                <DialogDescription>
                  Set up your new e-commerce store with a custom subdomain
                </DialogDescription>
              </DialogHeader>
              <Form {...createStoreForm}>
                <form onSubmit={createStoreForm.handleSubmit(onCreateStore)} className="space-y-4">
                  <FormField
                    control={createStoreForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Amazing Store" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createStoreForm.control}
                    name="subdomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomain</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input 
                              placeholder="mystore" 
                              {...field}
                              className="rounded-r-none"
                            />
                            <span className="bg-slate-100 border border-l-0 border-slate-300 px-3 py-2 text-sm text-slate-600 rounded-r-md">
                              .storebuilder.com
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createStoreForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell customers about your store..."
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      disabled={createStoreMutation.isPending}
                      className="flex-1"
                    >
                      {createStoreMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Create Store
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Stores</p>
                  <p className="text-2xl font-bold text-slate-900">{stores?.length || 0}</p>
                </div>
                <StoreIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">$0</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Products</p>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                </div>
                <Package className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stores Grid */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Stores</h2>
          {stores && stores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <Card key={store.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{store.name}</CardTitle>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <CardDescription>
                      {store.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Subdomain:</span>
                        <span className="font-medium">{store.subdomain}.storebuilder.com</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button asChild size="sm" className="flex-1">
                          <Link href={`/store/${store.id}`}>
                            <Settings className="w-4 h-4 mr-2" />
                            Manage
                          </Link>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`http://${store.subdomain}.storebuilder.com`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <StoreIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No stores yet</h3>
                <p className="text-slate-600 mb-6">
                  Create your first store to start selling online
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Store
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
