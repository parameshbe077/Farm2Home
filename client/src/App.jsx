import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import FloatingCartBar from './components/FloatingCartBar';
import Toast from './components/Toast';
import ScrollToTop from './components/ScrollToTop';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import About from './pages/About';
import Contact from './pages/Contact';
import TrackOrder from './pages/TrackOrder';
import CustomerLogin from './pages/CustomerLogin';
import MyOrders from './pages/MyOrders';
import Checkout from './pages/Checkout';
import Privacy from './pages/Privacy';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminMessages from './pages/admin/AdminMessages';
import AdminRiders from './pages/admin/AdminRiders';
import DeliveryLogin from './pages/delivery/DeliveryLogin';
import DeliveryOrders from './pages/delivery/DeliveryOrders';
import './admin.css';

function StoreRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/track-order" element={<TrackOrder />} />
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/privacy" element={<Privacy />} />
    </Routes>
  );
}

function DeliveryRoutes() {
  return (
    <Routes>
      <Route path="/delivery/login" element={<DeliveryLogin />} />
      <Route path="/delivery" element={<DeliveryOrders />} />
    </Routes>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedAdminRoute />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="riders" element={<AdminRiders />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const isDelivery = pathname.startsWith('/delivery');

  return (
    <>
      <ScrollToTop />
      {isAdmin ? (
        <AdminRoutes />
      ) : isDelivery ? (
        <DeliveryRoutes />
      ) : (
        <>
          <Header />
          <main>
            <StoreRoutes />
          </main>
          <Footer />
          <CartDrawer />
          <FloatingCartBar />
        </>
      )}
      <Toast />
    </>
  );
}
