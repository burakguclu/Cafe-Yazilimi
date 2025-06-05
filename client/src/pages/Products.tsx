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
  Search as SearchIcon 
} from '@mui/icons-material';
import { api } from '../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
  type: string;
  imageUrl: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    type: '',
    imageUrl: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      const response = await api.getProducts();
      console.log('Veritabanından gelen ürünler:', response.data);
      setProducts(response.data);
    } catch (error) {
      showSnackbar('Ürünler yüklenirken bir hata oluştu', 'error');
    }
  };

  const getProductImage = (name: string) => {
    const imageMap: { [key: string]: string } = {
      'Kıymalı Gözleme': '/images/kiymali-gozleme.jpg',
      'Mantı': '/images/kiymali-manti.jpg',
      'Kola': '/images/kola.jpg'
    };
    const imagePath = imageMap[name];
    console.log('Ürün adı:', name);
    console.log('Eşleşen görsel yolu:', imagePath);
    console.log('Tüm görsel eşleştirmeleri:', imageMap);
    return imagePath;
  };

  const handleAddProduct = async () => {
    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        imageUrl: getProductImage(newProduct.name)
      };

      await api.addProduct(productData);
      setNewProduct({ name: '', price: '', type: '', imageUrl: '' });
      setOpenDialog(false);
      loadProducts();
      showSnackbar('Ürün başarıyla eklendi', 'success');
    } catch (error) {
      showSnackbar('Ürün eklenirken bir hata oluştu', 'error');
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;
    
    try {
      const productData = {
        name: editingProduct.name,
        price: parseFloat(editingProduct.price.toString()),
        type: editingProduct.type,
        imageUrl: getProductImage(editingProduct.name)
      };

      await api.updateProduct(editingProduct.id, productData);
      setEditingProduct(null);
      loadProducts();
      showSnackbar('Ürün başarıyla güncellendi', 'success');
    } catch (error) {
      console.error('Ürün güncelleme hatası:', error);
      showSnackbar('Ürün güncellenirken bir hata oluştu', 'error');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        return;
      }
      
      const response = await api.deleteProduct(productId);
      if (response.status === 200) {
        await loadProducts();
        showSnackbar('Ürün başarıyla silindi', 'success');
      }
    } catch (error: any) {
      console.error('Ürün silme hatası:', error);
      if (error.response?.status === 404) {
        showSnackbar('Ürün bulunamadı', 'error');
      } else if (error.response?.status === 400) {
        showSnackbar(error.response.data.error || 'Bu ürüne ait siparişler var', 'error');
      } else {
        showSnackbar('Ürün silinirken bir hata oluştu', 'error');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4">Ürünler</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Ürün Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setEditingProduct(null);
              setOpenDialog(true);
            }}
            startIcon={<AddIcon />}
          >
            Yeni Ürün Ekle
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', width: '80px' }}>Resim</TableCell>
              <TableCell sx={{ color: 'white' }}>Ürün Adı</TableCell>
              <TableCell sx={{ color: 'white' }}>Fiyat</TableCell>
              <TableCell sx={{ color: 'white' }}>Tür</TableCell>
              <TableCell sx={{ color: 'white', width: '120px' }}>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow 
                key={product.id}
                sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
              >
                <TableCell>
                  <Box
                    component="img"
                    src={getProductImage(product.name)}
                    alt={product.name}
                    onError={(e) => {
                      console.error('Resim yükleme hatası:', product.name);
                      console.error('Hedef resim yolu:', getProductImage(product.name));
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
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.price} TL</TableCell>
                <TableCell>{product.type}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Düzenle">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingProduct(product);
                          setOpenDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          setEditingProduct(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ürün Adı"
            fullWidth
            value={editingProduct ? editingProduct.name : newProduct.name}
            onChange={(e) => {
              if (editingProduct) {
                setEditingProduct({ ...editingProduct, name: e.target.value });
              } else {
                setNewProduct({ ...newProduct, name: e.target.value });
              }
            }}
          />
          <TextField
            margin="dense"
            label="Fiyat"
            type="number"
            fullWidth
            value={editingProduct ? editingProduct.price : newProduct.price}
            onChange={(e) => {
              if (editingProduct) {
                setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) });
              } else {
                setNewProduct({ ...newProduct, price: e.target.value });
              }
            }}
          />
          <TextField
            margin="dense"
            label="Tür"
            select
            fullWidth
            value={editingProduct ? editingProduct.type : newProduct.type}
            onChange={(e) => {
              if (editingProduct) {
                setEditingProduct({ ...editingProduct, type: e.target.value });
              } else {
                setNewProduct({ ...newProduct, type: e.target.value });
              }
            }}
          >
            <MenuItem value="Gözleme">Gözleme</MenuItem>
            <MenuItem value="Mantı">Mantı</MenuItem>
            <MenuItem value="İçecek">İçecek</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenDialog(false);
              setEditingProduct(null);
            }}
          >
            İptal
          </Button>
          <Button 
            onClick={editingProduct ? handleEditProduct : handleAddProduct}
            variant="contained"
            color="primary"
          >
            {editingProduct ? 'Güncelle' : 'Ekle'}
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