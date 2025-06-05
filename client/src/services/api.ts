import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const api = {
  // Müşteri işlemleri
  getCustomers: () => axios.get(`${API_URL}/customers`),
  addCustomer: (customer: { name: string; surname: string }) => 
    axios.post(`${API_URL}/customers`, customer),
  
  // Ürün işlemleri
  getProducts: () => axios.get(`${API_URL}/products`),
  addProduct: (product: { name: string; price: number; type: string }) =>
    axios.post(`${API_URL}/products`, product),
  updateProduct: (productId: number, product: { 
    name: string; 
    price: number; 
    type: string;
    imageUrl: string;
  }) => axios.put(`${API_URL}/products/${productId}`, product),
  deleteProduct: (productId: number) => {
    return axios.delete(`${API_URL}/products/${productId}`);
  },

  // Sipariş işlemleri
  getCustomerOrders: (customerId: number) => 
    axios.get(`${API_URL}/customers/${customerId}/orders`),
  addOrder: (order: { 
    customer_id: number; 
    product_id: number; 
    quantity: number; 
    total_price: number; 
  }) => axios.post(`${API_URL}/orders`, order),
  deleteOrder: (orderId: number) => {
    return axios.delete(`${API_URL}/orders/${orderId}`);
  },

  saveOrderToExcel: (orderData: any) => {
    return axios.post(`${API_URL}/orders/save-to-excel`, orderData);
  },

  deleteCustomerOrders: async (customerId: number) => {
    return axios.delete(`${API_URL}/orders/customer/${customerId}`);
  }
}; 