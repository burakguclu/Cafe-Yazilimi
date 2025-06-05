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
  InputAdornment
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
  product: {
    name: string;
    type: string;
    imageUrl: string;
  };
}

export default function CustomerOrders({ customerId, customerName, onAddOrder, onPayment }: CustomerOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newOrder, setNewOrder] = useState({
    product_id: '',
    quantity: '1'
  });
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
      setOrders(response.data);
    } catch (error) {
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

  const handleAddOrder = async () => {
    try {
      const product = products.find(p => p.id === parseInt(newOrder.product_id));
      if (!product) return;

      await api.addOrder({
        customer_id: customerId,
        product_id: parseInt(newOrder.product_id),
        quantity: parseInt(newOrder.quantity),
        total_price: product.price * parseInt(newOrder.quantity)
      });

      setNewOrder({ product_id: '', quantity: '1' });
      setOpenDialog(false);
      loadOrders();
      showSnackbar('Sipariş başarıyla eklendi', 'success');
    } catch (error) {
      showSnackbar('Sipariş eklenirken bir hata oluştu', 'error');
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
      // Excel'e kaydetme işlemi
      const orderData = {
        customerName,
        date: new Date().toLocaleString('tr-TR'),
        items: orders.map(order => ({
          productName: order.product.name,
          quantity: order.quantity,
          price: order.total_price / order.quantity,
          total: order.total_price
        })),
        total: orders.reduce((sum, order) => sum + order.total_price, 0)
      };

      await api.saveOrderToExcel(orderData);

      // Siparişleri silme
      await api.deleteCustomerOrders(customerId);
      
      // State'i güncelleme
      setOrders([]);
      
      showSnackbar('Ödeme başarıyla tamamlandı', 'success');
    } catch (error) {
      showSnackbar('Ödeme işlemi sırasında bir hata oluştu', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getProductImage = (type: string) => {
    switch (type) {
      case 'Gözleme':
        return '/images/kiymali-gozleme.jpg';
      case 'Mantı':
        return '/images/kiymali-manti.jpg';
      case 'İçecek':
        return '/images/ayran.jpg';
      default:
        return '/images/default.jpg';
    }
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
        <Typography variant="h4">{customerName}</Typography>
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
            {orders.map((order) => (
              <TableRow 
                key={order.id}
                sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableCell>
                  <Box
                    component="img"
                    src={order.product?.imageUrl || getProductImage(order.product?.type)}
                    alt={order.product?.name}
                    sx={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1,
                      boxShadow: 1
                    }}
                  />
                </TableCell>
                <TableCell>{order.product?.name}</TableCell>
                <TableCell>{order.product?.type}</TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>{order.total_price} TL</TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString('tr-TR')}
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Yeni Sipariş Ekle</DialogTitle>
        <DialogContent>
          <TextField
            select
            margin="dense"
            label="Ürün"
            fullWidth
            value={newOrder.product_id}
            onChange={(e) => setNewOrder({ ...newOrder, product_id: e.target.value })}
          >
            {products.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.name} - {product.price} TL
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Adet"
            type="number"
            fullWidth
            value={newOrder.quantity}
            onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button 
            onClick={handleAddOrder}
            variant="contained"
            color="primary"
          >
            Ekle
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