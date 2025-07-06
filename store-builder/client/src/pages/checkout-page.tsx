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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Smartphone, Building, Truck, DollarSign } from "lucide-react";
import { useLocation } from "wouter";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  shippingAddress: z.string().min(10, "Please provide complete shipping address"),
  paymentMethod: z.enum(["esewa", "khalti", "ipsconnect", "bank_transfer", "cash_on_delivery"]),
  paymentProvider: z.string().optional(),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

// Mock cart data - in real app this would come from cart state
const mockCartItems = [
  { id: 1, name: "Wireless Headphones", price: 2500, quantity: 1, image: "/api/placeholder/100/100" },
  { id: 2, name: "Smartphone Case", price: 800, quantity: 2, image: "/api/placeholder/100/100" },
];

const cartTotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

export default function CheckoutPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedPayment, setSelectedPayment] = useState<string>("");

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingAddress: "",
      paymentMethod: "cash_on_delivery",
      notes: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      const res = await apiRequest("POST", "/api/orders", {
        ...data,
        total: cartTotal,
        items: mockCartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      return res.json();
    },
    onSuccess: (order) => {
      toast({
        title: "Order Placed Successfully!",
        description: `Order #${order.id} has been created. You will receive confirmation shortly.`,
      });
      navigate("/order-confirmation");
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CheckoutForm) => {
    // Handle different payment methods
    if (data.paymentMethod === "esewa") {
      // Redirect to eSewa payment gateway
      window.location.href = `https://esewa.com.np/epay/main?tAmt=${cartTotal}&amt=${cartTotal}&txAmt=0&psc=0&pdc=0&scd=EPAYTEST&pid=ORDER-${Date.now()}`;
      return;
    }

    if (data.paymentMethod === "khalti") {
      // Redirect to Khalti payment gateway
      window.location.href = `https://khalti.com/payment/verify/?pidx=ORDER-${Date.now()}&amount=${cartTotal * 100}`;
      return;
    }

    if (data.paymentMethod === "ipsconnect") {
      // Redirect to IPSConnect payment gateway
      window.location.href = `https://ipsconnect.com.np/payment?amount=${cartTotal}&pid=ORDER-${Date.now()}`;
      return;
    }

    // For bank transfer and cash on delivery, create order directly
    createOrderMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order with secure payment</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockCartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>Rs. {cartTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping & Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Customer Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter complete shipping address with landmarks"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Payment Method</h3>
                    
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedPayment(value);
                              }}
                              className="grid grid-cols-1 gap-4"
                            >
                              {/* eSewa */}
                              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value="esewa" id="esewa" />
                                <Label htmlFor="esewa" className="flex items-center gap-3 cursor-pointer flex-1">
                                  <Smartphone className="w-5 h-5 text-green-600" />
                                  <div>
                                    <div className="font-medium">eSewa</div>
                                    <div className="text-sm text-gray-600">Pay with eSewa digital wallet</div>
                                  </div>
                                  <Badge variant="secondary">Popular</Badge>
                                </Label>
                              </div>

                              {/* Khalti */}
                              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value="khalti" id="khalti" />
                                <Label htmlFor="khalti" className="flex items-center gap-3 cursor-pointer flex-1">
                                  <CreditCard className="w-5 h-5 text-purple-600" />
                                  <div>
                                    <div className="font-medium">Khalti</div>
                                    <div className="text-sm text-gray-600">Pay with Khalti digital wallet</div>
                                  </div>
                                </Label>
                              </div>

                              {/* IPSConnect */}
                              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value="ipsconnect" id="ipsconnect" />
                                <Label htmlFor="ipsconnect" className="flex items-center gap-3 cursor-pointer flex-1">
                                  <Building className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <div className="font-medium">IPSConnect</div>
                                    <div className="text-sm text-gray-600">Pay via online banking</div>
                                  </div>
                                </Label>
                              </div>

                              {/* Bank Transfer */}
                              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                                <Label htmlFor="bank_transfer" className="flex items-center gap-3 cursor-pointer flex-1">
                                  <Building className="w-5 h-5 text-gray-600" />
                                  <div>
                                    <div className="font-medium">Bank Transfer</div>
                                    <div className="text-sm text-gray-600">Direct bank transfer</div>
                                  </div>
                                </Label>
                              </div>

                              {/* Cash on Delivery */}
                              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                                <Label htmlFor="cash_on_delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                                  <Truck className="w-5 h-5 text-orange-600" />
                                  <div>
                                    <div className="font-medium">Cash on Delivery</div>
                                    <div className="text-sm text-gray-600">Pay when your order arrives</div>
                                  </div>
                                  <Badge variant="secondary">Safe</Badge>
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Bank Transfer Details */}
                  {selectedPayment === "bank_transfer" && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">Bank Transfer Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Bank:</strong> Nepal Bank Limited</p>
                          <p><strong>Account Name:</strong> Your Store Name</p>
                          <p><strong>Account Number:</strong> 01234567890</p>
                          <p><strong>Branch:</strong> Kathmandu</p>
                          <p className="text-blue-700 font-medium">
                            Please include Order ID in transfer remarks
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Order Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special instructions for your order..."
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? "Processing..." : "Place Order"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}