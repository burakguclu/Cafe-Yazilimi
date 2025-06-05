import { useState, useEffect } from 'react'
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton,
  ThemeProvider
} from '@mui/material'
import { Search as SearchIcon, Add as AddIcon, Payment as PaymentIcon } from '@mui/icons-material'
import type { AlertColor } from '@mui/material'
import { styled } from '@mui/material/styles'
import './App.css'
import { api } from './services/api'
import Products from './pages/Products'
import { theme } from './theme'
import CustomerOrders from './components/CustomerOrders'

const drawerWidth = '20%'

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginLeft: drawerWidth,
  height: 'calc(100vh - 64px)',
  width: '80%',
  overflow: 'auto'
}))

interface Customer {
  id: number;
  name: string;
  surname: string;
}

function App() {
  const [openDialog, setOpenDialog] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState({ name: '', surname: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as AlertColor })
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    const filtered = customers.filter(customer => 
      `${customer.name} ${customer.surname}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredCustomers(filtered)
  }, [searchQuery, customers])

  const loadCustomers = async () => {
    try {
      const response = await api.getCustomers()
      setCustomers(response.data)
    } catch (error) {
      showSnackbar('Müşteriler yüklenirken bir hata oluştu', 'error')
    }
  }

  const handleAddCustomer = async () => {
    try {
      await api.addCustomer(newCustomer)
      setNewCustomer({ name: '', surname: '' })
      setOpenDialog(false)
      loadCustomers()
      showSnackbar('Müşteri başarıyla eklendi', 'success')
    } catch (error) {
      showSnackbar('Müşteri eklenirken bir hata oluştu', 'error')
    }
  }

  const showSnackbar = (message: string, severity: AlertColor) => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handlePayment = () => {
    // Implementation of handlePayment function
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Neşe Gözleme ve Mantı Evi
            </Typography>
            <Button 
              color="inherit" 
              onClick={() => setCurrentPage('products')}
            >
              Ürünler
            </Button>
            <Button 
              color="inherit" 
              onClick={() => setOpenDialog(true)}
              startIcon={<AddIcon />}
            >
              Müşteri Ekle
            </Button>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              marginTop: '64px',
              backgroundColor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
              position: 'fixed',
              height: 'calc(100vh - 64px)'
            },
          }}
        >
          <Box sx={{ 
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Müşteri Ara..."
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
          </Box>
          <List sx={{ 
            overflow: 'auto',
            height: 'calc(100% - 80px)'
          }}>
            {filteredCustomers.map((customer) => (
              <ListItem 
                key={customer.id}
                onClick={() => {
                  setSelectedCustomer(customer)
                  setCurrentPage('home')
                }}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: selectedCustomer?.id === customer.id ? 'primary.main' : 'transparent',
                  color: selectedCustomer?.id === customer.id ? 'white' : 'text.primary',
                  '&:hover': {
                    backgroundColor: selectedCustomer?.id === customer.id ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)',
                  },
                  transition: 'all 0.2s ease-in-out',
                  py: 1.5
                }}
              >
                <ListItemText 
                  primary={`${customer.name} ${customer.surname}`}
                  primaryTypographyProps={{
                    sx: { 
                      fontWeight: selectedCustomer?.id === customer.id ? 'bold' : 'normal',
                      fontSize: '1rem'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Drawer>

        <Main>
          <Toolbar />
          {currentPage === 'products' ? (
            <Products />
          ) : selectedCustomer ? (
            <CustomerOrders 
              customerId={selectedCustomer.id}
              customerName={`${selectedCustomer.name} ${selectedCustomer.surname}`}
              onAddOrder={() => setOpenDialog(true)}
              onPayment={handlePayment}
            />
          ) : (
            <Box sx={{ 
              height: '100%',
              width: '100%',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1
            }}>
              <Typography variant="h4" color="text.secondary" sx={{ mb: 2 }}>
                Lütfen bir müşteri seçin
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Siparişleri görüntülemek için soldaki listeden bir müşteri seçin
              </Typography>
            </Box>
          )}
        </Main>

        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Ad"
              fullWidth
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Soyad"
              fullWidth
              value={newCustomer.surname}
              onChange={(e) => setNewCustomer({ ...newCustomer, surname: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>İptal</Button>
            <Button 
              onClick={handleAddCustomer}
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
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

export default App
