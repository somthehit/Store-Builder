import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  User, ShoppingCart, Search, Star, Heart, 
  MapPin, Phone, Mail, LogOut, Package,
  CreditCard, Truck
} from "lucide-react";
import CustomerAuthPage from "./customer-auth-page";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: string;
  inventory: number;
  category?: string;
  image?: string;
  brand?: string;
  status?: string;
}

interface Store {
  id: number;
  name: string;
  description?: string;
  subdomain: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  theme?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zone?: string;
  loyaltyPoints?: number;
}

export default function StorefrontPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<{ productId: number; quantity: number }[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current store info from subdomain
  const { data: store } = useQuery<Store>({
    queryKey: ['/api/store/current'],
  });

  // Get store products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/storefront/products'],
  });

  // Check if customer is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiRequest('/api/customer/me');
        if (response.ok) {
          const customerData = await response.json();
          setCustomer(customerData);
        }
      } catch (error) {
        // Not logged in, which is fine
      }
    };
    checkAuth();
  }, []);

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory && product.status === 'active';
  });

  const handleAuthSuccess = (customerData: Customer) => {
    setCustomer(customerData);
    setShowAuth(false);
    toast({
      title: "Welcome!",
      description: `Hello ${customerData.name}, you're now signed in.`,
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/customer/logout', {
        method: 'POST',
      });
      setCustomer(null);
      setCart([]);
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out.",
      });
    }
  };

  const addToCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => 
          item.productId === productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { productId, quantity: 1 }];
      }
    });
    
    toast({
      title: "Added to cart",
      description: "Product added to your cart successfully.",
    });
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (showAuth) {
    return (
      <CustomerAuthPage 
        storeName={store?.name}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Store Not Found</h1>
          <p className="text-gray-600">This store doesn't exist or is currently unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ 
      color: store.primaryColor || '#000',
      fontFamily: store.fontFamily || 'Inter'
    }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Store Logo/Name */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold" style={{ color: store.primaryColor || '#000' }}>
                {store.name}
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {customer ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-600">Welcome, </span>
                    <span className="font-medium">{customer.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuth(true)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
              
              <Button
                size="sm"
                className="relative"
                style={{ backgroundColor: store.primaryColor || '#3B82F6' }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {getCartItemCount() > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {getCartItemCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Store Info */}
      {store.description && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-gray-600 text-center">{store.description}</p>
          </div>
        </div>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4 overflow-x-auto">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Products
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedCategory
                ? "Try adjusting your search or filter criteria."
                : "This store doesn't have any products yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                    <Button variant="ghost" size="sm" className="p-1 h-auto">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {product.brand && (
                    <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
                  )}
                  
                  {product.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold" style={{ color: store.primaryColor || '#000' }}>
                        Rs. {parseFloat(product.price).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {product.inventory > 0 ? `${product.inventory} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      disabled={product.inventory === 0}
                      onClick={() => addToCart(product.id)}
                      style={{ backgroundColor: store.primaryColor || '#3B82F6' }}
                      className="shrink-0"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Customer Benefits */}
      {customer && (
        <div className="bg-white border-t mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">
                  Loyalty Points: {customer.loyaltyPoints || 0}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CreditCard className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Secure Payments</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Truck className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">{store.name}</h3>
            <p className="text-gray-300 mb-4">
              Your trusted online store for quality products
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                info@{store.subdomain}.com
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                +977-1-234-5678
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Kathmandu, Nepal
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}