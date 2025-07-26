import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency } from "../../utils/helpers";

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
  isFeatured: boolean;
  isActive: boolean;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

import { apiRequest, API_ENDPOINTS } from "../../config/api";

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("DESC");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const params = useLocalSearchParams();
  const { token } = useAuth();

  // Debounce search query to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 5000); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Set initial search/category from params
    if (params.search) {
      setSearchQuery(params.search as string);
    }
    if (params.category) {
      setSelectedCategory(params.category as string);
    }
    fetchCategories();
  }, [params]);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearchQuery, selectedCategory, sortBy, order, currentPage]);

  const fetchCategories = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.CATEGORIES);

      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        sortBy,
        order,
      });

      if (searchQuery) queryParams.append("search", debouncedSearchQuery);
      if (selectedCategory) queryParams.append("category", selectedCategory);

      const data = await apiRequest(
        `${API_ENDPOINTS.PRODUCTS}?${queryParams}`,
        {},
        token || undefined
      );

      if (data.success) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleCategoryFilter = useCallback((category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback(
    (newSortBy: string) => {
      if (sortBy === newSortBy) {
        setOrder(order === "ASC" ? "DESC" : "ASC");
      } else {
        setSortBy(newSortBy);
        setOrder("DESC");
      }
      setCurrentPage(1);
    },
    [sortBy, order]
  );

  const handleProductPress = (productId: number) => {
    router.push(`/product/${productId}`);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className="bg-white rounded-lg shadow-sm p-4 mb-4 mx-2 flex-1"
      onPress={() => handleProductPress(item.id)}
    >
      <Image
        source={{ uri: item.images?.[0] || "https://via.placeholder.com/150" }}
        style={{ width: "100%", height: 150, borderRadius: 8 }}
        contentFit="cover"
      />
      <Text className="font-semibold text-gray-900 mt-2" numberOfLines={2}>
        {item.name}
      </Text>
      <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
        {item.shortDescription || item.description}
      </Text>
      <View className="flex-row items-center mt-2">
        <Text className="text-blue-600 font-bold text-lg">
          {formatCurrency(item.price)}
        </Text>
        {item.comparePrice && item.comparePrice > item.price && (
          <Text className="text-gray-500 text-sm line-through ml-2">
            {formatCurrency(item.comparePrice)}
          </Text>
        )}
      </View>
      <Text
        className={`text-xs mt-1 ${
          item.stockQuantity > 0 ? "text-green-600" : "text-red-500"
        }`}
      >
        {item.stockQuantity > 0
          ? `${item.stockQuantity} in stock`
          : "Out of stock"}
      </Text>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity
      className={`rounded-full px-4 py-2 mr-2 ${
        selectedCategory === item ? "bg-blue-600" : "bg-gray-200"
      }`}
      onPress={() =>
        handleCategoryFilter(selectedCategory === item ? null : item)
      }
    >
      <Text
        className={`font-medium ${
          selectedCategory === item ? "text-white" : "text-gray-700"
        }`}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800 mb-3">Products</Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg mb-3">
          <TextInput
            className="flex-1 px-4 py-2 text-gray-800"
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <Ionicons name="search" size={20} color="#6B7280" className="mr-3" />
        </View>

        {/* Categories Filter */}
        <View className="mb-3">
          <FlatList
            data={["All", ...categories]}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`rounded-full px-4 py-2 mr-2 ${
                  (item === "All" && !selectedCategory) ||
                  selectedCategory === item
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}
                onPress={() =>
                  handleCategoryFilter(item === "All" ? null : item)
                }
              >
                <Text
                  className={`font-medium ${
                    (item === "All" && !selectedCategory) ||
                    selectedCategory === item
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Sort Options */}
        <View className="flex-row items-center">
          <Text className="text-gray-600 mr-3">Sort by:</Text>
          <TouchableOpacity
            className={`px-3 py-1 rounded mr-2 ${
              sortBy === "name" ? "bg-blue-100" : "bg-gray-100"
            }`}
            onPress={() => handleSort("name")}
          >
            <Text
              className={sortBy === "name" ? "text-blue-600" : "text-gray-700"}
            >
              Name {sortBy === "name" && (order === "ASC" ? "↑" : "↓")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-3 py-1 rounded mr-2 ${
              sortBy === "price" ? "bg-blue-100" : "bg-gray-100"
            }`}
            onPress={() => handleSort("price")}
          >
            <Text
              className={sortBy === "price" ? "text-blue-600" : "text-gray-700"}
            >
              Price {sortBy === "price" && (order === "ASC" ? "↑" : "↓")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      <View className="flex-1 px-2">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500">Loading products...</Text>
          </View>
        ) : products.length > 0 ? (
          <>
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <View className="flex-row justify-center items-center py-4 bg-white">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg mr-2 ${
                    pagination.hasPrevPage ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  onPress={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <Text
                    className={
                      pagination.hasPrevPage ? "text-white" : "text-gray-500"
                    }
                  >
                    Previous
                  </Text>
                </TouchableOpacity>

                <Text className="mx-4 text-gray-600">
                  Page {currentPage} of {pagination.totalPages}
                </Text>

                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg ml-2 ${
                    pagination.hasNextPage ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  onPress={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  <Text
                    className={
                      pagination.hasNextPage ? "text-white" : "text-gray-500"
                    }
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="search-outline" size={60} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4">
              No products found
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Try adjusting your search or filters
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
