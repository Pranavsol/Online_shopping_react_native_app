import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, parsePrice } from '../../utils/helpers';

interface Product {
  id: number;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  comparePrice?: number;
  images: string[];
  stockQuantity: number;
  category: string;
  sku: string;
  isFeatured: boolean;
  isActive: boolean;
}

import { apiRequest, API_ENDPOINTS } from '../../config/api';
const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { id } = useLocalSearchParams();
  const { token, user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest(API_ENDPOINTS.PRODUCT_BY_ID(id as string), {}, token || undefined);
      
      if (data.success) {
        setProduct(data.data.product);
      } else {
        Alert.alert('Error', 'Product not found');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      Alert.alert('Error', 'Failed to load product details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add items to cart', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]);
      return;
    }

    if (!product) return;

    try {
      setIsAddingToCart(true);
      const data = await apiRequest(API_ENDPOINTS.CART, {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      }, token);

      if (data.success) {
        Alert.alert('Success', 'Item added to cart successfully!', [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const adjustQuantity = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stockQuantity || 0)) {
      setQuantity(newQuantity);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Loading product details...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Product not found</Text>
      </SafeAreaView>
    );
  }

  const isOutOfStock = product.stockQuantity === 0;
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-800">Product Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1">
        {/* Product Images */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const slideSize = event.nativeEvent.layoutMeasurement.width;
              const index = Math.floor(
                event.nativeEvent.contentOffset.x / slideSize
              );
              setSelectedImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {product.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image || 'https://via.placeholder.com/400' }}
                style={{ width, height: 300 }}
                contentFit="cover"
              />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          {product.images.length > 1 && (
            <View className="flex-row justify-center mt-3">
              {product.images.map((_, index) => (
                <View
                  key={index}
                  className={`w-2 h-2 rounded-full mx-1 ${
                    index === selectedImageIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {product.name}
          </Text>
          
          <Text className="text-gray-600 text-sm mb-3">
            SKU: {product.sku} • Category: {product.category}
          </Text>

          {/* Price */}
          <View className="flex-row items-center mb-4">
            <Text className="text-3xl font-bold text-blue-600">
              {formatCurrency(product.price)}
            </Text>
            {hasDiscount && (
              <>
                <Text className="text-lg text-gray-500 line-through ml-3">
                  {formatCurrency(product.comparePrice)}
                </Text>
                <View className="bg-red-100 px-2 py-1 rounded ml-2">
                  <Text className="text-red-600 text-xs font-semibold">
                    {Math.round((1 - parsePrice(product.price) / parsePrice(product.comparePrice!)) * 100)}% OFF
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Stock Status */}
          <View className="flex-row items-center mb-4">
            <Ionicons
              name={isOutOfStock ? 'close-circle' : 'checkmark-circle'}
              size={20}
              color={isOutOfStock ? '#EF4444' : '#10B981'}
            />
            <Text className={`ml-2 font-medium ${
              isOutOfStock ? 'text-red-500' : 'text-green-600'
            }`}>
              {isOutOfStock ? 'Out of Stock' : `${product.stockQuantity} in stock`}
            </Text>
          </View>

          {/* Description */}
          <Text className="text-gray-800 text-base leading-6 mb-6">
            {product.description}
          </Text>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-3">Quantity</Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  className="w-10 h-10 rounded-lg bg-gray-200 items-center justify-center"
                  onPress={() => adjustQuantity(-1)}
                  disabled={quantity <= 1}
                >
                  <Ionicons name="remove" size={20} color="#374151" />
                </TouchableOpacity>
                
                <Text className="mx-4 text-xl font-semibold text-gray-800">
                  {quantity}
                </Text>
                
                <TouchableOpacity
                  className="w-10 h-10 rounded-lg bg-gray-200 items-center justify-center"
                  onPress={() => adjustQuantity(1)}
                  disabled={quantity >= product.stockQuantity}
                >
                  <Ionicons name="add" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Add to Cart Button */}
          <TouchableOpacity
            className={`rounded-lg py-4 items-center ${
              isOutOfStock ? 'bg-gray-300' : 'bg-blue-600'
            } ${isAddingToCart ? 'opacity-50' : ''}`}
            onPress={addToCart}
            disabled={isOutOfStock || isAddingToCart}
          >
            <Text className={`font-semibold text-lg ${
              isOutOfStock ? 'text-gray-500' : 'text-white'
            }`}>
              {isAddingToCart 
                ? 'Adding to Cart...' 
                : isOutOfStock 
                  ? 'Out of Stock' 
                  : 'Add to Cart'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}