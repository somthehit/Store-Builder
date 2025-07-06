import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zone?: string;
  loyaltyPoints?: number;
  isVerified?: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  zone?: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  error: Error | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  // Check if customer is already logged in
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/customer/me'],
    queryFn: async () => {
      const response = await apiRequest('/api/customer/me');
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update customer state when query data changes
  useEffect(() => {
    if (data) {
      setCustomer(data);
      setError(null);
    } else {
      setCustomer(null);
    }
  }, [data]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await apiRequest('/api/customer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCustomer(data.customer);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/customer/me'] });
    },
    onError: (error: Error) => {
      setError(error);
      setCustomer(null);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest('/api/customer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCustomer(data.customer);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/customer/me'] });
    },
    onError: (error: Error) => {
      setError(error);
      setCustomer(null);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/customer/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return response.json();
    },
    onSuccess: () => {
      setCustomer(null);
      setError(null);
      queryClient.clear();
    },
    onError: (error: Error) => {
      setError(error);
    },
  });

  const login = async (data: LoginData) => {
    return loginMutation.mutateAsync(data);
  };

  const register = async (data: RegisterData) => {
    return registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoading,
        error,
        login,
        register,
        logout,
        refetch,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}