import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  images: string[];
  stockQuantity: number;
  category: string;
  isFeatured: boolean;
}

import { apiRequest, API_ENDPOINTS } from '../../config/api';
import { formatCurrency } from '../../utils/helpers';

export default function HomeScreen() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch featured products
      const featuredData = await apiRequest(`${API_ENDPOINTS.PRODUCTS}?featured=true&limit=10`);
      
      if (featuredData.success) {
        setFeaturedProducts(featuredData.data.products);
      }

      // Fetch categories
      const categoriesData = await apiRequest(API_ENDPOINTS.CATEGORIES);
      
      if (categoriesData.success) {
        setCategories(categoriesData.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryPress = (category: string) => {
    router.push(`/products?category=${encodeURIComponent(category)}`);
  };

  const handleProductPress = (productId: number) => {
    router.push(`/product/${productId}`);
  };

  const renderFeaturedProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className="bg-white rounded-lg shadow-sm p-4 mr-4 w-48"
      onPress={() => handleProductPress(item.id)}
    >
      <Image
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
        style={{ width: '100%', height: 120, borderRadius: 8 }}
        contentFit="cover"
      />
      <Text className="font-semibold text-gray-900 mt-2" numberOfLines={2}>
        {item.name}
      </Text>
      <Text className="text-blue-600 font-bold mt-1">
        {formatCurrency(item.price)}
      </Text>
      <Text className="text-gray-500 text-xs mt-1">
        {item.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
      </Text>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity
      className="bg-blue-50 rounded-lg p-4 mr-3 min-w-24 items-center"
      onPress={() => handleCategoryPress(item)}
    >
      <Text className="text-blue-600 font-medium text-center">{item}</Text>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <Ionicons name="storefront-outline" size={80} color="#9CA3AF" />
        <Text className="text-2xl font-bold text-gray-800 mt-4 text-center">
          Welcome to Our Store
        </Text>
        <Text className="text-gray-600 text-center mt-2 mb-8">
          Please sign in to start shopping
        </Text>
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-3 px-8"
          onPress={() => router.push('/login')}
        >
          <Text className="text-white font-semibold text-lg">Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-6">
        {/* Header */}
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          Hello, {user.firstName}!
        </Text>
        <Text className="text-gray-600 mb-6">What are you looking for today?</Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-lg shadow-sm mb-6">
          <TextInput
            className="flex-1 px-4 py-3 text-gray-800"
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            className="p-3"
            onPress={handleSearch}
          >
            <Ionicons name="search" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        {categories.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Categories
            </Text>
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Featured Products */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-800">
              Featured Products
            </Text>
            <TouchableOpacity onPress={() => router.push('/products')}>
              <Text className="text-blue-600 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <Text className="text-gray-500 text-center">Loading...</Text>
          ) : featuredProducts.length > 0 ? (
            <FlatList
              data={featuredProducts}
              renderItem={renderFeaturedProduct}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <Text className="text-gray-500 text-center">No featured products available</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View className="flex-row justify-between">
          <TouchableOpacity
            className="bg-white rounded-lg p-4 flex-1 mr-2 items-center shadow-sm"
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Ionicons name="cart-outline" size={24} color="#3B82F6" />
            <Text className="text-gray-800 font-medium mt-2">My Cart</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-white rounded-lg p-4 flex-1 ml-2 items-center shadow-sm"
            onPress={() => router.push('/(tabs)/orders')}
          >
            <Ionicons name="receipt-outline" size={24} color="#3B82F6" />
            <Text className="text-gray-800 font-medium mt-2">My Orders</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}