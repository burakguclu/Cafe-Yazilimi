import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  MenuItem,
  InputAdornment,
  Card,
  CardMedia,
  CardContent
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { api } from '../services/api';

interface CustomerOrdersProps {
  customerId: number;
  customerName: string;
  onAddOrder: () => void;
  onPayment: () => void;
}

interface Order {
  id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  created_at: string;
  order_date?: string;
  product_name?: string;
  productType?: string;
  product?: {
    name: string;
    type: string;
    imageUrl: string;
  };
}

interface CartItem {
  product_id: number;
  name: string;
  type: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export default function CustomerOrders({ customerId, customerName, onAddOrder, onPayment }: CustomerOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, [customerId]);

  const loadOrders = async () => {
    try {
      const response = await api.getCustomerOrders(customerId);
      console.log('Yüklenen siparişler:', response.data);
      const transformedOrders = response.data.map((order: any) => ({
        ...order,
        product: {
          name: order.product_name,
          type: order.type,
          imageUrl: '',
        },
      }));
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Sipariş yükleme hatası:', error);
      showSnackbar('Siparişler yüklenirken bir hata oluştu', 'error');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.getProducts();
      setProducts(response.data);
    } catch (error) {
      showSnackbar('Ürünler yüklenirken bir hata oluştu', 'error');
    }
  };

  const getProductImage = (name: string | undefined) => {
    if (!name) {
      console.log('Ürün adı bulunamadı');
      return '/images/default.jpg';
    }

    const imageMap: { [key: string]: string } = {
      'Kıymalı Gözleme': '/images/kiymali-gozleme.jpg',
      'Mantı': '/images/kiymali-manti.jpg',
      'Kola': '/images/kola.jpg'
    };

    const imagePath = imageMap[name] || '/images/default.jpg';
    console.log('Müşteri Siparişi - Ürün adı:', name);
    console.log('Müşteri Siparişi - Eşleşen görsel yolu:', imagePath);
    return imagePath;
  };

  const handleAddToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        name: product.name,
        type: product.type,
        price: product.price,
        quantity: 1,
        imageUrl: getProductImage(product.name)
      }]);
    }
  };

  const handleRemoveFromCart = (productId: number) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId));
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(cartItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const handleSaveOrders = async () => {
    try {
      for (const item of cartItems) {
        await api.addOrder({
          customer_id: customerId,
          product_id: item.product_id,
          quantity: item.quantity,
          total_price: item.price * item.quantity
        });
      }

      setCartItems([]);
      setOpenDialog(false);
      loadOrders();
      showSnackbar('Siparişler başarıyla eklendi', 'success');
    } catch (error) {
      showSnackbar('Siparişler eklenirken bir hata oluştu', 'error');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      await api.deleteOrder(orderId);
      loadOrders();
      showSnackbar('Sipariş başarıyla silindi', 'success');
    } catch (error) {
      showSnackbar('Sipariş silinirken bir hata oluştu', 'error');
    }
  };

  const handlePayment = async () => {
    try {
      if (orders.length === 0) {
        showSnackbar('Ödenecek sipariş bulunamadı', 'error');
        return;
      }

      // Excel'e kaydetme işlemi
      const orderData = {
        customerName,
        date: new Date().toLocaleString('tr-TR'),
        items: orders.map(order => ({
          productName: order.product?.name,
          type: order.product?.type,
          quantity: order.quantity,
          price: order.total_price / order.quantity,
          total: order.total_price
        })),
        total: orders.reduce((sum, order) => sum + order.total_price, 0)
      };

      // Önce Excel'e kaydet
      await api.saveOrderToExcel(orderData);

      // Sonra her bir siparişi tek tek sil
      for (const order of orders) {
        await api.deleteOrder(order.id);
      }
      
      // Siparişleri yeniden yükle
      await loadOrders();
      
      showSnackbar('Ödeme başarıyla tamamlandı', 'success');
    } catch (error: any) {
      console.error('Ödeme hatası:', error);
      if (error.response?.status === 404) {
        showSnackbar('Sipariş bulunamadı', 'error');
      } else {
        showSnackbar('Ödeme işlemi sırasında bir hata oluştu', 'error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        position: 'sticky',
        top: 0,
        backgroundColor: 'background.paper',
        zIndex: 1,
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h4" color="text.primary">{customerName}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenDialog(true)}
            startIcon={<AddIcon />}
          >
            Yeni Sipariş Ekle
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handlePayment}
            startIcon={<PaymentIcon />}
          >
            Ödeme Yap
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', width: '80px' }}>Resim</TableCell>
              <TableCell sx={{ color: 'white' }}>Ürün</TableCell>
              <TableCell sx={{ color: 'white' }}>Tür</TableCell>
              <TableCell sx={{ color: 'white' }}>Adet</TableCell>
              <TableCell sx={{ color: 'white' }}>Toplam Fiyat</TableCell>
              <TableCell sx={{ color: 'white' }}>Tarih</TableCell>
              <TableCell sx={{ color: 'white', width: '100px' }}>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => {
              const productName = order.product?.name || order.product_name;
              const productType = order.product?.type || order.productType || '-';
              
              return (
                <TableRow 
                  key={order.id}
                  sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableCell>
                    <Box
                      component="img"
                      src={getProductImage(productName)}
                      alt={productName || 'Ürün'}
                      onError={(e) => {
                        console.error('Müşteri Siparişi - Resim yükleme hatası:', productName);
                        console.error('Müşteri Siparişi - Hedef resim yolu:', getProductImage(productName));
                        e.currentTarget.src = '/images/default.jpg';
                      }}
                      sx={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 1,
                        boxShadow: 1
                      }}
                    />
                  </TableCell>
                  <TableCell>{productName || 'Bilinmeyen Ürün'}</TableCell>
                  <TableCell>{productType}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.total_price} TL</TableCell>
                  <TableCell>
                    {new Date(order.order_date || order.created_at).toLocaleString('tr-TR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Sil">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          setCartItems([]);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Yeni Sipariş Ekle</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Sol taraf - Ürünler */}
            <Box sx={{ flex: 2, maxHeight: '70vh', overflow: 'auto' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                {products.map((product) => (
                  <Card 
                    key={product.id}
                    sx={{ 
                      width: 'calc(33.33% - 16px)',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 3
                      }
                    }}
                    onClick={() => handleAddToCart(product)}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={getProductImage(product.name)}
                      alt={product.name}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.type}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                        {product.price} TL
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>

            {/* Sağ taraf - Sepet */}
            <Box sx={{ flex: 1, borderLeft: '1px solid', borderColor: 'divider', pl: 2 }}>
              <Typography variant="h6" gutterBottom>Sepet</Typography>
              {cartItems.length === 0 ? (
                <Typography color="text.secondary">Sepetiniz boş</Typography>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <Box key={item.product_id} sx={{ mb: 2, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          component="img"
                          src={item.imageUrl}
                          alt={item.name}
                          sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1">{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.type}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                          >
                            -
                          </IconButton>
                          <Typography>{item.quantity}</Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                          >
                            +
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveFromCart(item.product_id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>
                        Toplam: {item.price * item.quantity} TL
                      </Typography>
                    </Box>
                  ))}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="h6">
                      Toplam: {cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)} TL
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setCartItems([]);
          }}>
            İptal
          </Button>
          <Button 
            onClick={handleSaveOrders}
            variant="contained"
            color="primary"
            disabled={cartItems.length === 0}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 