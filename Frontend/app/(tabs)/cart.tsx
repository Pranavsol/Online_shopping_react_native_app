import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/helpers';

interface CartItem {
  id: number;
  quantity: number;
  price: number;
  Product: {
    id: number;
    name: string;
    price: number;
    images: string[];
    stockQuantity: number;
    isActive: boolean;
  };
}

interface CartSummary {
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
}

import { apiRequest, API_ENDPOINTS } from '../../config/api';

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  
  const { token, user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest(API_ENDPOINTS.CART, {}, token);

      if (data.success) {
        setCartItems(data.data.cartItems);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      
      const data = await apiRequest(`${API_ENDPOINTS.CART}/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQuantity }),
      }, token);

      if (data.success) {
        await fetchCart(); // Refresh cart to get updated totals
      } else {
        Alert.alert('Error', data.error || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const removeItem = async (itemId: number) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const data = await apiRequest(`${API_ENDPOINTS.CART}/${itemId}`, {
                method: 'DELETE',
              }, token);

              if (data.success) {
                await fetchCart();
              } else {
                Alert.alert('Error', data.error || 'Failed to remove item');
              }
            } catch (error) {
              console.error('Failed to remove item:', error);
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const clearCart = async () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const data = await apiRequest(API_ENDPOINTS.CART, {
                method: 'DELETE',
              }, token);

              if (data.success) {
                setCartItems([]);
                setSummary({
                  totalItems: 0,
                  subtotal: 0,
                  tax: 0,
                  total: 0,
                });
              } else {
                Alert.alert('Error', data.error || 'Failed to clear cart');
              }
            } catch (error) {
              console.error('Failed to clear cart:', error);
              Alert.alert('Error', 'Failed to clear cart');
            }
          },
        },
      ]
    );
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checking out');
      return;
    }
    router.push('/checkout');
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const isUpdating = updatingItems.has(item.id);
    const isOutOfStock = item.Product.stockQuantity === 0;
    const hasStockIssue = item.quantity > item.Product.stockQuantity;

    return (
      <View className="bg-white rounded-lg shadow-sm p-4 mb-3 mx-4">
        <View className="flex-row">
          <Image
            source={{ uri: item.Product.images?.[0] || 'https://via.placeholder.com/80' }}
            style={{ width: 80, height: 80, borderRadius: 8 }}
            contentFit="cover"
          />
          
          <View className="flex-1 ml-3">
            <Text className="font-semibold text-gray-900 text-base" numberOfLines={2}>
              {item.Product.name}
            </Text>
            
            <Text className="text-blue-600 font-bold text-lg mt-1">
              {formatCurrency(item.price)}
            </Text>

            {(isOutOfStock || hasStockIssue) && (
              <Text className="text-red-500 text-sm mt-1">
                {isOutOfStock ? 'Out of stock' : `Only ${item.Product.stockQuantity} left`}
              </Text>
            )}

            {/* Quantity Controls */}
            <View className="flex-row items-center justify-between mt-3">
              <View className="flex-row items-center">
                <TouchableOpacity
                  className="w-8 h-8 rounded bg-gray-200 items-center justify-center"
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={isUpdating || item.quantity <= 1}
                >
                  <Ionicons name="remove" size={16} color="#374151" />
                </TouchableOpacity>
                
                <Text className="mx-3 text-lg font-semibold text-gray-800">
                  {item.quantity}
                </Text>
                
                <TouchableOpacity
                  className="w-8 h-8 rounded bg-gray-200 items-center justify-center"
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={isUpdating || item.quantity >= item.Product.stockQuantity}
                >
                  <Ionicons name="add" size={16} color="#374151" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="p-2"
                onPress={() => removeItem(item.id)}
                disabled={isUpdating}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-6">
        <Ionicons name="cart-outline" size={80} color="#9CA3AF" />
        <Text className="text-2xl font-bold text-gray-800 mt-4 text-center">
          Sign In to View Cart
        </Text>
        <Text className="text-gray-600 text-center mt-2 mb-8">
          Please sign in to access your shopping cart
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500">Loading cart...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-800">My Cart</Text>
          {cartItems.length > 0 && (
            <TouchableOpacity onPress={clearCart}>
              <Text className="text-red-500 font-medium">Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        {summary && (
          <Text className="text-gray-600 mt-1">
            {summary.totalItems} {summary.totalItems === 1 ? 'item' : 'items'}
          </Text>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="cart-outline" size={80} color="#9CA3AF" />
          <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
            Your cart is empty
          </Text>
          <Text className="text-gray-600 text-center mt-2 mb-8">
            Add some products to get started
          </Text>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-3 px-8"
            onPress={() => router.push('/(tabs)/products')}
          >
            <Text className="text-white font-semibold text-lg">Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Cart Items */}
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={fetchCart} />
            }
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 200 }}
          />

          {/* Cart Summary */}
          {summary && (
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
              <View className="space-y-2 mb-4">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Subtotal</Text>
                  <Text className="text-gray-800">{formatCurrency(summary.subtotal)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Tax</Text>
                  <Text className="text-gray-800">{formatCurrency(summary.tax)}</Text>
                </View>
                <View className="flex-row justify-between border-t border-gray-200 pt-2">
                  <Text className="text-lg font-bold text-gray-800">Total</Text>
                  <Text className="text-lg font-bold text-blue-600">
                    {formatCurrency(summary.total)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                className="bg-blue-600 rounded-lg py-4 items-center"
                onPress={proceedToCheckout}
              >
                <Text className="text-white font-semibold text-lg">
                  Proceed to Checkout
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}