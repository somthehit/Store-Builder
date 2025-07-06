import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Store, 
  Globe, 
  Settings, 
  Smartphone, 
  TrendingUp, 
  Shield, 
  Code, 
  Plus,
  ShoppingCart,
  Users,
  DollarSign,
  Package
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const features = [
    {
      icon: Globe,
      title: "Custom Subdomains",
      description: "Each store gets its own subdomain like store.yourdomain.com for professional branding.",
      color: "bg-blue-500"
    },
    {
      icon: Settings,
      title: "Multi-Tenant Architecture",
      description: "Secure, scalable infrastructure that keeps each store's data completely isolated.",
      color: "bg-emerald-500"
    },
    {
      icon: Smartphone,
      title: "Mobile Responsive",
      description: "Beautiful, fast-loading stores that work perfectly on any device or screen size.",
      color: "bg-purple-500"
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Track sales, customer behavior, and inventory with detailed reports and insights.",
      color: "bg-amber-500"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-level security with JWT authentication and encrypted data storage.",
      color: "bg-red-500"
    },
    {
      icon: Code,
      title: "Developer Friendly",
      description: "Built with modern tech stack: React, Node.js, PostgreSQL, and comprehensive APIs.",
      color: "bg-indigo-500"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Store className="text-white text-sm" />
                </div>
                <span className="ml-2 text-xl font-bold text-slate-900">StoreBuilder</span>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#examples" className="text-slate-600 hover:text-slate-900 transition-colors">Examples</a>
              <a href="#docs" className="text-slate-600 hover:text-slate-900 transition-colors">Docs</a>
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-600">Welcome, {user.name}!</span>
                  <Button asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/auth">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth">Start Free Trial</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Build Your
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                {" "}E-commerce Empire
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Create unlimited e-commerce stores with custom subdomains. Manage products, orders, and customers 
              from one powerful dashboard. Start selling in minutes, not months.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg"
                onClick={() => navigate("/auth")}
              >
                Start Free Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg"
                onClick={() => navigate("/auth")}
              >
                <Plus className="w-4 h-4 mr-2" />
                View Demo
              </Button>
            </div>

            {/* Hero Dashboard Preview */}
            <div className="relative mt-16">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-2xl opacity-20 transform scale-105"></div>
              <Card className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">Store Dashboard</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                          <p className="text-2xl font-bold text-blue-900">$12,450</p>
                        </div>
                        <DollarSign className="text-blue-500 w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-emerald-600 font-medium">Orders</p>
                          <p className="text-2xl font-bold text-emerald-900">247</p>
                        </div>
                        <ShoppingCart className="text-emerald-500 w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Products</p>
                          <p className="text-2xl font-bold text-purple-900">89</p>
                        </div>
                        <Package className="text-purple-500 w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-amber-600 font-medium">Customers</p>
                          <p className="text-2xl font-bold text-amber-900">156</p>
                        </div>
                        <Users className="text-amber-500 w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-700">Recent Orders</h4>
                      <Button variant="link" size="sm" className="text-blue-500">
                        View All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-slate-600">#ORD-001 - John Doe</span>
                        <span className="text-sm font-medium text-slate-900">$129.99</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-slate-600">#ORD-002 - Jane Smith</span>
                        <span className="text-sm font-medium text-slate-900">$89.50</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From product management to order fulfillment, our platform handles the complexity 
              so you can focus on growing your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                    <feature.icon className="text-white w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Choose the perfect plan for your business. Start free, upgrade as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <Card className="border-2 border-slate-200 hover:border-blue-300 transition-colors">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">Starter</CardTitle>
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  $0<span className="text-lg text-slate-600 font-normal">/month</span>
                </div>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-slate-600">1 Store</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-slate-600">Up to 10 Products</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-slate-600">Basic Analytics</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/auth">Get Started Free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-2 border-blue-500 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                Most Popular
              </Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">Professional</CardTitle>
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  $29<span className="text-lg text-slate-600 font-normal">/month</span>
                </div>
                <CardDescription>For growing businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-slate-600">5 Stores</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-slate-600">Unlimited Products</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-slate-600">Advanced Analytics</span>
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/auth">Start Free Trial</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2 border-slate-200 hover:border-purple-300 transition-colors">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  $99<span className="text-lg text-slate-600 font-normal">/month</span>
                </div>
                <CardDescription>For large businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-slate-600">Unlimited Stores</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-slate-600">Unlimited Products</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-slate-600">Enterprise Analytics</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Store className="text-white text-sm" />
                </div>
                <span className="ml-2 text-xl font-bold">StoreBuilder</span>
              </div>
              <p className="text-slate-400 mb-4">
                The easiest way to create and manage multiple e-commerce stores with custom subdomains.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8 bg-slate-800" />
          
          <div className="text-center">
            <p className="text-slate-400">
              © 2024 StoreBuilder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
