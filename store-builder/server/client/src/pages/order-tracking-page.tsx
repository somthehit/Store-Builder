import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  CreditCard, 
  Phone, 
  Mail,
  Calendar,
  AlertCircle,
  Edit,
  Save
} from "lucide-react";
import { useParams } from "wouter";

const updateOrderSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  notes: z.string().optional(),
});

type UpdateOrderForm = z.infer<typeof updateOrderSchema>;

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
  processing: { color: "bg-blue-100 text-blue-800", icon: Package, label: "Processing" },
  shipped: { color: "bg-purple-100 text-purple-800", icon: Truck, label: "Shipped" },
  delivered: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Delivered" },
  cancelled: { color: "bg-red-100 text-red-800", icon: AlertCircle, label: "Cancelled" },
};

const paymentStatusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending Payment" },
  paid: { color: "bg-green-100 text-green-800", label: "Paid" },
  failed: { color: "bg-red-100 text-red-800", label: "Payment Failed" },
  refunded: { color: "bg-gray-100 text-gray-800", label: "Refunded" },
};

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  const { data: orderItems } = useQuery({
    queryKey: ["/api/orders", orderId, "items"],
    enabled: !!orderId,
  });

  const form = useForm<UpdateOrderForm>({
    resolver: zodResolver(updateOrderSchema),
    defaultValues: {
      status: order?.status || "pending",
      trackingNumber: order?.trackingNumber || "",
      carrier: order?.carrier || "",
      estimatedDelivery: order?.estimatedDelivery || "",
      paymentStatus: order?.paymentStatus || "pending",
      notes: order?.notes || "",
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: UpdateOrderForm) => {
      const res = await apiRequest("PUT", `/api/orders/${orderId}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Updated Successfully!",
        description: "Order status and tracking information have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId] });
      setIsUpdateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: UpdateOrderForm) => {
    updateOrderMutation.mutate(data);
  };

  const getStatusSteps = (currentStatus: string) => {
    const steps = [
      { key: "pending", label: "Order Placed", icon: Package },
      { key: "processing", label: "Processing", icon: Clock },
      { key: "shipped", label: "Shipped", icon: Truck },
      { key: "delivered", label: "Delivered", icon: CheckCircle },
    ];

    const statusOrder = ["pending", "processing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status]?.icon || Package;
  const statusSteps = getStatusSteps(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
          <p className="text-gray-600 mt-2">Track and manage order #{order.id}</p>
        </div>

        <div className="grid gap-8">
          {/* Order Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <StatusIcon className="w-5 h-5" />
                  Order Status
                </span>
                <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Update Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Update Order Status</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Order Status</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="trackingNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tracking Number</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="carrier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Carrier</FormLabel>
                              <Select value={field.value || ""} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select carrier" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pathao">Pathao</SelectItem>
                                  <SelectItem value="daraz">Daraz Express</SelectItem>
                                  <SelectItem value="dhl">DHL</SelectItem>
                                  <SelectItem value="fedex">FedEx</SelectItem>
                                  <SelectItem value="ups">UPS</SelectItem>
                                  <SelectItem value="local">Local Delivery</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="paymentStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Status</FormLabel>
                              <Select value={field.value || ""} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="failed">Failed</SelectItem>
                                  <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ""} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full" disabled={updateOrderMutation.isPending}>
                          <Save className="w-4 h-4 mr-2" />
                          {updateOrderMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className={statusConfig[order.status]?.color}>
                    {statusConfig[order.status]?.label}
                  </Badge>
                  <Badge className={paymentStatusConfig[order.paymentStatus]?.color}>
                    {paymentStatusConfig[order.paymentStatus]?.label}
                  </Badge>
                </div>

                {/* Status Timeline */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    {statusSteps.map((step, index) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center mb-2
                            ${step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                          `}>
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <span className={`text-xs text-center ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 -z-10">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(statusSteps.findIndex(s => s.active) / (statusSteps.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Tracking Information */}
                {order.trackingNumber && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Tracking Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tracking Number:</span>
                        <span className="font-mono">{order.trackingNumber}</span>
                      </div>
                      {order.carrier && (
                        <div className="flex justify-between">
                          <span>Carrier:</span>
                          <span className="capitalize">{order.carrier}</span>
                        </div>
                      )}
                      {order.estimatedDelivery && (
                        <div className="flex justify-between">
                          <span>Estimated Delivery:</span>
                          <span>{new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm">{order.customerName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {order.customerEmail}
                  </p>
                </div>
                {order.customerPhone && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {order.customerPhone}
                    </p>
                  </div>
                )}
                {order.shippingAddress && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Shipping Address</Label>
                    <p className="text-sm">{order.shippingAddress}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm capitalize">{order.paymentMethod || "Not specified"}</p>
                </div>
                {order.paymentProvider && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Payment Provider</Label>
                    <p className="text-sm capitalize">{order.paymentProvider}</p>
                  </div>
                )}
                {order.paymentTransactionId && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Transaction ID</Label>
                    <p className="text-sm font-mono">{order.paymentTransactionId}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-lg font-bold">Rs. {parseFloat(order.total).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product?.name || "Product"}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Price: Rs. {parseFloat(item.price).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rs. {(parseFloat(item.price) * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}