import { getStoreDb } from "./db";
import { storage } from "./storage";
import { 
  products, 
  customers, 
  customerBehavior, 
  productViews, 
  recommendations, 
  productAttributes,
  productCategories,
  productCategoryMappings,
  customerPreferences,
  orders,
  orderItems
} from "@shared/store-schema";
import { eq, sql, desc, and, gt, lt, inArray } from "drizzle-orm";

export interface RecommendationRequest {
  storeId: number;
  customerId?: number;
  sessionId: string;
  limit?: number;
  excludeProductIds?: number[];
  type?: 'collaborative' | 'content_based' | 'trending' | 'recently_viewed' | 'hybrid';
}

export interface RecommendationResult {
  productId: number;
  score: number;
  type: string;
  reasons: string[];
  product?: any;
}

class RecommendationEngine {
  
  // Helper method to get store database
  private async getStoreDatabase(storeId: number) {
    const store = await storage.getStore(storeId);
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }
    return getStoreDb(store.databaseUrl);
  }
  
  // Track customer behavior
  async trackBehavior(data: {
    customerId?: number;
    sessionId: string;
    storeId: number;
    productId?: number;
    action: 'view' | 'add_to_cart' | 'purchase' | 'remove_from_cart' | 'search';
    searchQuery?: string;
    timeSpent?: number;
    metadata?: any;
  }) {
    try {
      const storeDb = await this.getStoreDatabase(data.storeId);
      await storeDb.insert(customerBehavior).values({
        customerId: data.customerId,
        sessionId: data.sessionId,
        action: data.action,
        productId: data.productId,
        searchQuery: data.searchQuery,
        deviceType: 'desktop', // Default value
        source: 'direct', // Default value
      });
    } catch (error) {
      console.error('Error tracking customer behavior:', error);
    }
  }

  // Track product views specifically
  async trackProductView(data: {
    customerId?: number;
    sessionId: string;
    storeId: number;
    productId: number;
    viewDuration?: number;
  }) {
    try {
      const storeDb = await this.getStoreDatabase(data.storeId);
      
      await storeDb.insert(productViews).values({
        customerId: data.customerId,
        sessionId: data.sessionId,
        productId: data.productId,
        viewDuration: data.viewDuration || 0,
      });

      // Also track as behavior
      await this.trackBehavior({
        customerId: data.customerId,
        sessionId: data.sessionId,
        storeId: data.storeId,
        productId: data.productId,
        action: 'view',
        timeSpent: data.viewDuration,
      });
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }

  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { storeId, type = 'hybrid', limit = 10 } = request;
    
    try {
      switch (type) {
        case 'collaborative':
          return await this.generateCollaborativeRecommendations(request);
        case 'content_based':
          return await this.generateContentBasedRecommendations(request);
        case 'trending':
          return await this.generateTrendingRecommendations(request);
        case 'recently_viewed':
          return await this.generateRecentlyViewedRecommendations(request);
        case 'hybrid':
        default:
          return await this.generateHybridRecommendations(request);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  private async generateCollaborativeRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { storeId, customerId, limit = 10, excludeProductIds = [] } = request;
    const storeDb = await this.getStoreDatabase(storeId);

    if (!customerId) {
      return [];
    }

    try {
      // Find customers with similar purchase behavior
      const similarCustomers = await storeDb
        .select({
          customerId: customerBehavior.customerId,
          count: sql<number>`count(*)`,
        })
        .from(customerBehavior)
        .where(
          and(
            eq(customerBehavior.action, 'purchase'),
            sql`${customerBehavior.productId} IN (
              SELECT product_id FROM ${customerBehavior} 
              WHERE customer_id = ${customerId} AND action = 'purchase'
            )`
          )
        )
        .groupBy(customerBehavior.customerId)
        .having(sql`count(*) > 1`)
        .orderBy(desc(sql`count(*)`))
        .limit(20);

      if (similarCustomers.length === 0) {
        return [];
      }

      const similarCustomerIds = similarCustomers.map(c => c.customerId).filter(id => id !== customerId);

      // Get products purchased by similar customers but not by current customer
      const recommendedProducts = await storeDb
        .select({
          productId: customerBehavior.productId,
          score: sql<number>`count(*)`,
        })
        .from(customerBehavior)
        .where(
          and(
            eq(customerBehavior.action, 'purchase'),
            inArray(customerBehavior.customerId, similarCustomerIds),
            sql`${customerBehavior.productId} NOT IN (
              SELECT product_id FROM ${customerBehavior}
              WHERE customer_id = ${customerId} AND action = 'purchase'
            )`,
            excludeProductIds.length > 0 ? sql`${customerBehavior.productId} NOT IN (${excludeProductIds.join(',')})` : sql`1=1`
          )
        )
        .groupBy(customerBehavior.productId)
        .orderBy(desc(sql`count(*)`))
        .limit(limit);

      return recommendedProducts
        .filter(item => item.productId)
        .map(item => ({
          productId: item.productId!,
          score: Math.min(item.score / 10, 1), // Normalize score
          type: 'collaborative',
          reasons: ['Customers like you also purchased this'],
        }));
    } catch (error) {
      console.error('Error in collaborative filtering:', error);
      return [];
    }
  }

  private async generateContentBasedRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { storeId, customerId, sessionId, limit = 10, excludeProductIds = [] } = request;
    const storeDb = await this.getStoreDatabase(storeId);

    try {
      // Get recently viewed products for this customer/session
      const viewedProducts = await storeDb
        .select({ productId: productViews.productId })
        .from(productViews)
        .where(
          customerId 
            ? eq(productViews.customerId, customerId)
            : eq(productViews.sessionId, sessionId)
        )
        .orderBy(desc(productViews.timestamp))
        .limit(5);

      if (viewedProducts.length === 0) {
        return [];
      }

      const viewedProductIds = viewedProducts.map(p => p.productId);

      // Get categories of viewed products
      const productCategories = await storeDb
        .select({
          categoryId: productCategoryMappings.categoryId,
          count: sql<number>`count(*)`,
        })
        .from(productCategoryMappings)
        .where(inArray(productCategoryMappings.productId, viewedProductIds))
        .groupBy(productCategoryMappings.categoryId)
        .orderBy(desc(sql`count(*)`));

      if (productCategories.length === 0) {
        return [];
      }

      const topCategoryIds = productCategories.slice(0, 3).map(c => c.categoryId);

      // Find similar products in same categories
      const similarProducts = await storeDb
        .select({
          productId: productCategoryMappings.productId,
          categoryCount: sql<number>`count(*)`,
        })
        .from(productCategoryMappings)
        .where(
          and(
            inArray(productCategoryMappings.categoryId, topCategoryIds),
            sql`${productCategoryMappings.productId} NOT IN (${viewedProductIds.join(',')})`,
            excludeProductIds.length > 0 ? sql`${productCategoryMappings.productId} NOT IN (${excludeProductIds.join(',')})` : sql`1=1`
          )
        )
        .groupBy(productCategoryMappings.productId)
        .orderBy(desc(sql`count(*)`))
        .limit(limit);

      return similarProducts.map(item => ({
        productId: item.productId,
        score: Math.min(item.categoryCount / topCategoryIds.length, 1),
        type: 'content_based',
        reasons: ['Similar to products you viewed'],
      }));
    } catch (error) {
      console.error('Error in content-based filtering:', error);
      return [];
    }
  }

  private async generateTrendingRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { storeId, limit = 10, excludeProductIds = [] } = request;
    const storeDb = await this.getStoreDatabase(storeId);

    try {
      // Get trending products based on recent views and purchases
      const trendingProducts = await storeDb
        .select({
          productId: customerBehavior.productId,
          viewScore: sql<number>`SUM(CASE WHEN action = 'view' THEN 1 ELSE 0 END)`,
          purchaseScore: sql<number>`SUM(CASE WHEN action = 'purchase' THEN 3 ELSE 0 END)`,
          totalScore: sql<number>`SUM(CASE WHEN action = 'view' THEN 1 WHEN action = 'purchase' THEN 3 ELSE 0 END)`,
        })
        .from(customerBehavior)
        .where(
          and(
            gt(customerBehavior.timestamp, sql`NOW() - INTERVAL '7 days'`),
            inArray(customerBehavior.action, ['view', 'purchase']),
            excludeProductIds.length > 0 ? sql`${customerBehavior.productId} NOT IN (${excludeProductIds.join(',')})` : sql`1=1`
          )
        )
        .groupBy(customerBehavior.productId)
        .having(sql`COUNT(*) > 2`)
        .orderBy(desc(sql`SUM(CASE WHEN action = 'view' THEN 1 WHEN action = 'purchase' THEN 3 ELSE 0 END)`))
        .limit(limit);

      const maxScore = trendingProducts[0]?.totalScore || 1;

      return trendingProducts
        .filter(item => item.productId)
        .map(item => ({
          productId: item.productId!,
          score: item.totalScore / maxScore,
          type: 'trending',
          reasons: ['Trending this week'],
        }));
    } catch (error) {
      console.error('Error in trending recommendations:', error);
      return [];
    }
  }

  private async generateRecentlyViewedRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { storeId, customerId, sessionId, limit = 10, excludeProductIds = [] } = request;
    const storeDb = await this.getStoreDatabase(storeId);

    try {
      const recentlyViewed = await storeDb
        .select({
          productId: productViews.productId,
          lastViewed: sql<Date>`MAX(${productViews.timestamp})`,
        })
        .from(productViews)
        .where(
          and(
            customerId 
              ? eq(productViews.customerId, customerId)
              : eq(productViews.sessionId, sessionId),
            gt(productViews.timestamp, sql`NOW() - INTERVAL '30 days'`),
            excludeProductIds.length > 0 ? sql`${productViews.productId} NOT IN (${excludeProductIds.join(',')})` : sql`1=1`
          )
        )
        .groupBy(productViews.productId)
        .orderBy(desc(sql`MAX(${productViews.timestamp})`))
        .limit(limit);

      return recentlyViewed.map((item, index) => ({
        productId: item.productId,
        score: Math.max(0.9 - (index * 0.1), 0.1), // Decreasing score based on recency
        type: 'recently_viewed',
        reasons: ['You viewed this recently'],
      }));
    } catch (error) {
      console.error('Error in recently viewed recommendations:', error);
      return [];
    }
  }

  private async generateHybridRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { limit = 10 } = request;
    
    try {
      // Get recommendations from multiple algorithms
      const [collaborative, contentBased, trending, recentlyViewed] = await Promise.all([
        this.generateCollaborativeRecommendations({ ...request, limit: Math.ceil(limit * 0.3) }),
        this.generateContentBasedRecommendations({ ...request, limit: Math.ceil(limit * 0.3) }),
        this.generateTrendingRecommendations({ ...request, limit: Math.ceil(limit * 0.2) }),
        this.generateRecentlyViewedRecommendations({ ...request, limit: Math.ceil(limit * 0.2) }),
      ]);

      // Combine and deduplicate recommendations
      const allRecommendations = [
        ...collaborative.map(r => ({ ...r, score: r.score * 0.4 })), // Weight collaborative higher
        ...contentBased.map(r => ({ ...r, score: r.score * 0.3 })),
        ...trending.map(r => ({ ...r, score: r.score * 0.2 })),
        ...recentlyViewed.map(r => ({ ...r, score: r.score * 0.1 })),
      ];

      // Deduplicate by product ID and combine scores
      const productScores = new Map<number, RecommendationResult>();
      
      allRecommendations.forEach(rec => {
        const existing = productScores.get(rec.productId);
        if (existing) {
          existing.score += rec.score;
          existing.reasons = [...new Set([...existing.reasons, ...rec.reasons])];
          existing.type = 'hybrid';
        } else {
          productScores.set(rec.productId, { ...rec, type: 'hybrid' });
        }
      });

      // Sort by combined score and return top results
      return Array.from(productScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in hybrid recommendations:', error);
      return [];
    }
  }

  private async storeRecommendations(request: RecommendationRequest, recommendationResults: RecommendationResult[]) {
    const { storeId, customerId, sessionId } = request;
    const storeDb = await this.getStoreDatabase(storeId);

    try {
      const recommendationsToStore = recommendationResults.map(result => ({
        customerId,
        sessionId,
        productId: result.productId,
        recommendationType: result.type,
        score: result.score.toString(),
        reasons: result.reasons,
      }));

      if (recommendationsToStore.length > 0) {
        await storeDb.insert(recommendations).values(recommendationsToStore);
      }
    } catch (error) {
      console.error('Error storing recommendations:', error);
    }
  }

  async updateCustomerPreferences(storeId: number, customerId: number) {
    const storeDb = await this.getStoreDatabase(storeId);

    try {
      // Analyze customer behavior to update preferences
      const categoryPreferences = await storeDb
        .select({
          categoryId: productCategoryMappings.categoryId,
          strength: sql<number>`COUNT(*) * 1.0 / (SELECT COUNT(*) FROM ${customerBehavior} WHERE customer_id = ${customerId})`,
        })
        .from(customerBehavior)
        .innerJoin(productCategoryMappings, eq(customerBehavior.productId, productCategoryMappings.productId))
        .where(eq(customerBehavior.customerId, customerId))
        .groupBy(productCategoryMappings.categoryId)
        .orderBy(desc(sql`COUNT(*)`));

      // Update customer preferences
      for (const pref of categoryPreferences) {
        await storeDb
          .insert(customerPreferences)
          .values({
            customerId,
            preferenceType: 'category',
            preferenceValue: pref.categoryId.toString(),
            strength: pref.strength.toString(),
          })
          .onConflictDoUpdate({
            target: [customerPreferences.customerId, customerPreferences.preferenceType, customerPreferences.preferenceValue],
            set: { strength: pref.strength.toString() },
          });
      }
    } catch (error) {
      console.error('Error updating customer preferences:', error);
    }
  }

  async trackRecommendationFeedback(data: {
    storeId: number;
    customerId?: number;
    sessionId: string;
    productId: number;
    action: 'shown' | 'clicked' | 'purchased';
  }) {
    const { storeId, customerId, sessionId, productId, action } = data;
    const storeDb = await this.getStoreDatabase(storeId);

    try {
      const updateData: any = {};
      const timeField = `${action}At`;
      
      updateData[action] = true;
      updateData[timeField] = new Date();

      await storeDb
        .update(recommendations)
        .set(updateData)
        .where(
          and(
            customerId ? eq(recommendations.customerId, customerId) : eq(recommendations.sessionId, sessionId),
            eq(recommendations.productId, productId)
          )
        );
    } catch (error) {
      console.error('Error tracking recommendation feedback:', error);
    }
  }

  async getRecommendationAnalytics(storeId: number, days: number = 30) {
    const storeDb = await this.getStoreDatabase(storeId);

    try {
      const analytics = await storeDb
        .select({
          recommendationType: recommendations.recommendationType,
          totalShown: sql<number>`COUNT(*)`,
          totalClicked: sql<number>`SUM(CASE WHEN clicked = true THEN 1 ELSE 0 END)`,
          totalPurchased: sql<number>`SUM(CASE WHEN purchased = true THEN 1 ELSE 0 END)`,
          clickThroughRate: sql<number>`ROUND(SUM(CASE WHEN clicked = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2)`,
          conversionRate: sql<number>`ROUND(SUM(CASE WHEN purchased = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2)`,
        })
        .from(recommendations)
        .where(
          and(
            eq(recommendations.shown, true),
            gt(recommendations.createdAt, sql`NOW() - INTERVAL '${days} days'`)
          )
        )
        .groupBy(recommendations.recommendationType);

      return analytics;
    } catch (error) {
      console.error('Error getting recommendation analytics:', error);
      return [];
    }
  }
}

export const recommendationEngine = new RecommendationEngine();