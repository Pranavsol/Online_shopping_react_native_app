import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  totalPrice: number;
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
  createdAt: string;
  estimatedDelivery: string;
  OrderItems: OrderItem[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
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

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { token, user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [user, selectedStatus, currentPage]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (selectedStatus) {
        queryParams.append('status', selectedStatus);
      }

      const response = await fetch(`${API_BASE_URL}/orders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleOrderPress = (orderId: number) => {
    router.push(`/order/${orderId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280';
  };

  const getStatusIcon = (status: string) => {
    return STATUS_ICONS[status as keyof typeof STATUS_ICONS] || 'help-outline';
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      className="bg-white rounded-lg shadow-sm p-4 mb-3 mx-4"
      onPress={() => handleOrderPress(item.id)}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-gray-900 text-base">
          #{item.orderNumber}
        </Text>
        <View className="flex-row items-center">
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text
            className="ml-1 font-medium capitalize"
            style={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <Text className="text-gray-600 text-sm mb-2">
        Ordered on {formatDate(item.createdAt)}
      </Text>

      <Text className="text-blue-600 font-bold text-lg mb-3">
        ₹{item.totalAmount.toFixed(2)}
      </Text>

      {/* Order Items Preview */}
      <View className="flex-row items-center mb-3">
        {item.OrderItems.slice(0, 3).map((orderItem, index) => (
          <Image
            key={orderItem.id}
            source={{
              uri: orderItem.Product.images?.[0] || 'https://via.placeholder.com/40',
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              marginRight: 8,
              marginLeft: index > 0 ? -10 : 0,
              borderWidth: 2,
              borderColor: 'white',
            }}
            contentFit="cover"
          />
        ))}
        {item.OrderItems.length > 3 && (
          <View className="w-10 h-10 bg-gray-200 rounded-md items-center justify-center ml-2">
            <Text className="text-gray-600 text-xs font-medium">
              +{item.OrderItems.length - 3}
            </Text>
          </View>
        )}
        <Text className="ml-3 text-gray-600 text-sm">
          {item.OrderItems.length} {item.OrderItems.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-gray-500 text-sm">
          Estimated delivery: {formatDate(item.estimatedDelivery)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  const statusFilters = [
    { key: null, label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-6">
        <Ionicons name="receipt-outline" size={80} color="#9CA3AF" />
        <Text className="text-2xl font-bold text-gray-800 mt-4 text-center">
          Sign In to View Orders
        </Text>
        <Text className="text-gray-600 text-center mt-2 mb-8">
          Please sign in to access your order history
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
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800 mb-3">My Orders</Text>
        
        {/* Status Filters */}
        <FlatList
          data={statusFilters}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`rounded-full px-4 py-2 mr-2 ${
                selectedStatus === item.key ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              onPress={() => handleStatusFilter(item.key)}
            >
              <Text className={`font-medium ${
                selectedStatus === item.key ? 'text-white' : 'text-gray-700'
              }`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key || 'all'}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Loading orders...</Text>
        </View>
      ) : orders.length > 0 ? (
        <>
          <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={fetchOrders} />
            }
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          />
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <View className="flex-row justify-center items-center py-4 bg-white">
              <TouchableOpacity
                className={`px-4 py-2 rounded-lg mr-2 ${
                  pagination.hasPrevPage ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onPress={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <Text className={pagination.hasPrevPage ? 'text-white' : 'text-gray-500'}>
                  Previous
                </Text>
              </TouchableOpacity>
              
              <Text className="mx-4 text-gray-600">
                Page {currentPage} of {pagination.totalPages}
              </Text>
              
              <TouchableOpacity
                className={`px-4 py-2 rounded-lg ml-2 ${
                  pagination.hasNextPage ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onPress={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                <Text className={pagination.hasNextPage ? 'text-white' : 'text-gray-500'}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="receipt-outline" size={80} color="#9CA3AF" />
          <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
            No orders found
          </Text>
          <Text className="text-gray-600 text-center mt-2 mb-8">
            {selectedStatus
              ? `No ${selectedStatus} orders found`
              : 'You haven\'t placed any orders yet'
            }
          </Text>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-3 px-8"
            onPress={() => router.push('/(tabs)/products')}
          >
            <Text className="text-white font-semibold text-lg">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}