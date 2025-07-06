import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Store, Package, DollarSign } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex mb-4 gap-2">
                <Shield className="h-8 w-8 text-red-500" />
                <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                You don't have permission to access the admin panel.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Manage all stores and users on the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">-</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Stores</p>
                  <p className="text-2xl font-bold text-slate-900">-</p>
                </div>
                <Store className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Products</p>
                  <p className="text-2xl font-bold text-slate-900">-</p>
                </div>
                <Package className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Platform Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">-</p>
                </div>
                <DollarSign className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Admin functionality is not fully implemented yet. This would include:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>• View all users</li>
                <li>• Edit user roles</li>
                <li>• Suspend/activate accounts</li>
                <li>• View user activity</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Management</CardTitle>
              <CardDescription>
                Oversee all stores on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Admin functionality is not fully implemented yet. This would include:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>• View all stores</li>
                <li>• Moderate store content</li>
                <li>• Manage store settings</li>
                <li>• View store analytics</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
