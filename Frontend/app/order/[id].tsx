import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/helpers';

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  totalPrice: number;
  productSnapshot: {
    name: string;
    description: string;
    images: string[];
  };
  Product: {
    id: number;
    name: string;
    images: string[];
  };
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  OrderItems: OrderItem[];
}

const API_BASE_URL = 'http://localhost:5000/api';

const STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#8B5CF6',
  shipped: '#06B6D4',
  delivered: '#10B981',
  cancelled: '#EF4444',
  refunded: '#6B7280',
};

const STATUS_ICONS = {
  pending: 'time-outline',
  confirmed: 'checkmark-circle-outline',
  processing: 'cog-outline',
  shipped: 'airplane-outline',
  delivered: 'checkmark-done-outline',
  cancelled: 'close-circle-outline',
  refunded: 'return-up-back-outline',
};

const PAYMENT_METHOD_NAMES = {
  cash_on_delivery: 'Cash on Delivery',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  upi: 'UPI',
  net_banking: 'Net Banking',
  wallet: 'Digital Wallet',
};

export default function OrderDetailScreen() {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const { id } = useLocalSearchParams();
  const { token, user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.data.order);
      } else {
        Alert.alert('Error', 'Order not found');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      Alert.alert('Error', 'Failed to load order details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!order) return;

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              const response = await fetch(`${API_BASE_URL}/orders/${order.id}/cancel`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  reason: 'Cancelled by user',
                }),
              });

              const data = await response.json();

              if (data.success) {
                Alert.alert('Success', 'Order cancelled successfully');
                fetchOrder(); // Refresh order data
              } else {
                Alert.alert('Error', data.error || 'Failed to cancel order');
              }
            } catch (error) {
              console.error('Failed to cancel order:', error);
              Alert.alert('Error', 'Failed to cancel order');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280';
  };

  const getStatusIcon = (status: string) => {
    return STATUS_ICONS[status as keyof typeof STATUS_ICONS] || 'help-outline';
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Please sign in to view order details</Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Order not found</Text>
      </SafeAreaView>
    );
  }

  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800 ml-4">Order Details</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Order Status */}
        <View className="bg-white mx-4 mt-4 rounded-lg p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">
              #{order.orderNumber}
            </Text>
            <View className="flex-row items-center">
              <Ionicons
                name={getStatusIcon(order.status) as any}
                size={20}
                color={getStatusColor(order.status)}
              />
              <Text
                className="ml-2 font-semibold capitalize"
                style={{ color: getStatusColor(order.status) }}
              >
                {order.status}
              </Text>
            </View>
          </View>

          <Text className="text-gray-600 mb-2">
            Ordered on {formatDate(order.createdAt)}
          </Text>

          {order.trackingNumber && (
            <Text className="text-gray-600 mb-2">
              Tracking: {order.trackingNumber}
            </Text>
          )}

          <Text className="text-gray-600">
            Estimated delivery: {formatDate(order.estimatedDelivery)}
          </Text>

          {order.deliveredAt && (
            <Text className="text-green-600 font-medium mt-2">
              Delivered on {formatDate(order.deliveredAt)}
            </Text>
          )}

          {order.cancelledAt && (
            <View className="mt-2">
              <Text className="text-red-600 font-medium">
                Cancelled on {formatDate(order.cancelledAt)}
              </Text>
              {order.cancellationReason && (
                <Text className="text-gray-600 text-sm mt-1">
                  Reason: {order.cancellationReason}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Order Items */}
        <View className="bg-white mx-4 mt-4 rounded-lg p-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Items ({order.OrderItems.length})
          </Text>

          {order.OrderItems.map((item) => (
            <View key={item.id} className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0">
              <Image
                source={{
                  uri: item.Product?.images?.[0] || item.productSnapshot.images?.[0] || 'https://via.placeholder.com/60',
                }}
                style={{ width: 60, height: 60, borderRadius: 8 }}
                contentFit="cover"
              />
              
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-gray-900" numberOfLines={2}>
                  {item.Product?.name || item.productSnapshot.name}
                </Text>
                <Text className="text-gray-600 text-sm mt-1">
                  Quantity: {item.quantity}
                </Text>
                <Text className="text-blue-600 font-bold mt-1">
                  {formatCurrency(item.totalPrice)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment & Pricing */}
        <View className="bg-white mx-4 mt-4 rounded-lg p-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Payment Details
          </Text>

          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Payment Method</Text>
              <Text className="text-gray-800 font-medium">
                {PAYMENT_METHOD_NAMES[order.paymentMethod as keyof typeof PAYMENT_METHOD_NAMES] || order.paymentMethod}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="text-gray-800">
                ₹{(order.totalAmount - order.taxAmount - order.shippingAmount).toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Tax</Text>
              <Text className="text-gray-800">₹{order.taxAmount.toFixed(2)}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-600">Shipping</Text>
              <Text className="text-gray-800">
                {order.shippingAmount === 0 ? 'Free' : `₹${order.shippingAmount.toFixed(2)}`}
              </Text>
            </View>

            <View className="flex-row justify-between border-t border-gray-200 pt-2">
              <Text className="text-lg font-bold text-gray-800">Total</Text>
              <Text className="text-lg font-bold text-blue-600">
                ₹{order.totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        <View className="bg-white mx-4 mt-4 rounded-lg p-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Shipping Address
          </Text>
          
          <Text className="text-gray-800 font-medium">{order.shippingAddress.fullName}</Text>
          <Text className="text-gray-600 mt-1">{order.shippingAddress.address}</Text>
          <Text className="text-gray-600">
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
          </Text>
        </View>

        {/* Order Notes */}
        {order.notes && (
          <View className="bg-white mx-4 mt-4 rounded-lg p-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Order Notes
            </Text>
            <Text className="text-gray-600">{order.notes}</Text>
          </View>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <View className="mx-4 mt-4 mb-6">
            <TouchableOpacity
              className={`bg-red-500 rounded-lg py-3 items-center ${
                isCancelling ? 'opacity-50' : ''
              }`}
              onPress={cancelOrder}
              disabled={isCancelling}
            >
              <Text className="text-white font-semibold text-lg">
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}