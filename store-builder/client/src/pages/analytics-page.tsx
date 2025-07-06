import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  ShoppingCart, 
  BarChart3, 
  MousePointer,
  Star,
  Clock
} from "lucide-react";

interface RecommendationAnalytics {
  recommendationType: string;
  totalShown: number;
  totalClicked: number;
  totalPurchased: number;
  clickThroughRate: number;
  conversionRate: number;
}

export default function AnalyticsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [timeframe, setTimeframe] = useState("30");

  const { data: analytics = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/recommendation-analytics", storeId, timeframe],
    enabled: !!storeId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/recommendation-analytics/${storeId}?days=${timeframe}`);
      return response.json();
    },
  });

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["/api/stores", storeId],
    enabled: !!storeId,
  });

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "collaborative":
        return <Users className="w-5 h-5" />;
      case "content_based":
        return <Eye className="w-5 h-5" />;
      case "trending":
        return <TrendingUp className="w-5 h-5" />;
      case "recently_viewed":
        return <Clock className="w-5 h-5" />;
      case "hybrid":
        return <Star className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "collaborative":
        return "bg-blue-100 text-blue-800";
      case "content_based":
        return "bg-green-100 text-green-800";
      case "trending":
        return "bg-orange-100 text-orange-800";
      case "recently_viewed":
        return "bg-purple-100 text-purple-800";
      case "hybrid":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalMetrics = analytics.reduce(
    (acc, curr) => ({
      totalShown: acc.totalShown + curr.totalShown,
      totalClicked: acc.totalClicked + curr.totalClicked,
      totalPurchased: acc.totalPurchased + curr.totalPurchased,
    }),
    { totalShown: 0, totalClicked: 0, totalPurchased: 0 }
  );

  const overallCTR = totalMetrics.totalShown > 0 
    ? (totalMetrics.totalClicked / totalMetrics.totalShown) * 100 
    : 0;

  const overallConversion = totalMetrics.totalClicked > 0 
    ? (totalMetrics.totalPurchased / totalMetrics.totalClicked) * 100 
    : 0;

  if (storeLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="w-48 h-8 mb-2" />
            <Skeleton className="w-64 h-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="w-full h-6" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="w-16 h-8" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recommendation Analytics</h1>
            <p className="text-gray-600 mt-1">
              Performance insights for {store?.name || 'your store'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shown</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMetrics.totalShown.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Recommendations displayed to customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMetrics.totalClicked.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Recommendations clicked by customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallCTR.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Percentage of shown recommendations clicked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallConversion.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Percentage of clicks that resulted in purchases
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance by Recommendation Type */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance by Recommendation Type</CardTitle>
            <CardDescription>
              Detailed breakdown of how each recommendation algorithm performs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No recommendation data available</p>
                <p className="text-gray-400 text-sm">
                  Start getting recommendations to see analytics here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.map((metric: RecommendationAnalytics) => (
                  <div
                    key={metric.recommendationType}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getRecommendationIcon(metric.recommendationType)}
                        <Badge className={getTypeColor(metric.recommendationType)}>
                          {metric.recommendationType.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-8 text-center">
                      <div>
                        <div className="text-sm text-gray-500">Shown</div>
                        <div className="font-semibold">{metric.totalShown.toLocaleString()}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500">Clicked</div>
                        <div className="font-semibold">{metric.totalClicked.toLocaleString()}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500">Purchased</div>
                        <div className="font-semibold">{metric.totalPurchased.toLocaleString()}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500">CTR</div>
                        <div className="font-semibold">
                          {(metric.clickThroughRate * 100).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500">Conversion</div>
                        <div className="font-semibold">
                          {(metric.conversionRate * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights and Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
            <CardDescription>
              AI-powered insights to improve your recommendation performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overallCTR < 5 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-800">Low Click-Through Rate</h4>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    Your CTR is below average (5%). Consider improving product images, 
                    descriptions, or recommendation placement to boost engagement.
                  </p>
                </div>
              )}

              {analytics.some(a => a.recommendationType === 'collaborative' && a.totalShown < 100) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Collaborative Filtering Opportunity</h4>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Collaborative filtering performs better with more customer data. 
                    Encourage customer registrations to improve recommendation accuracy.
                  </p>
                </div>
              )}

              {overallConversion > 10 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">Excellent Performance</h4>
                  </div>
                  <p className="text-green-700 text-sm">
                    Your recommendation system is performing exceptionally well with a {overallConversion.toFixed(1)}% 
                    conversion rate. Keep up the great work!
                  </p>
                </div>
              )}

              {analytics.length === 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-800">Getting Started</h4>
                  </div>
                  <p className="text-gray-700 text-sm">
                    Once customers start interacting with your store, you'll see detailed 
                    analytics here. Share your store link to start collecting data.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}