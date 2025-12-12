import React, { useState, lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthContext, useAuthProvider } from "./hooks/useAuth";
import { CartProvider } from "./hooks/useCart.tsx";
import { usePageFocus } from "./hooks/usePageFocus";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import SizeGuidePage from "./pages/SizeGuidePage";
const AdminPage = lazy(() => import("./pages/AdminPage")); // Lazy load AdminPage
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ScrollToTop from "./components/ScrollToTop";

import WhatsAppButton from "./components/WhatsAppButton";
import ReturnsPolicyPage from "./pages/ReturnsPolicyPage";
import TransferPendingPage from "./pages/TransferPendingPage";
import NuestraMisionPage from "./pages/NuestraMisionPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import ShippingPage from "./pages/ShippingPage.tsx";
import CartSidebar from "./components/CartSidebar";


const AnimatedRoutes: React.FC<{isHomePage: boolean, paddingTop: string}> = ({isHomePage, paddingTop}) => {
  const location = useLocation();

  return (
    <main key={location.pathname} className={`flex-1 fade-in-up ${paddingTop}`}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tienda" element={<ShopPage />} />
        <Route path="/producto/:id" element={<ProductPage />} />
        <Route path="/shipping" element={<ShippingPage />} />
        <Route path="/tallas" element={<SizeGuidePage />} />
        {/* Wrap AdminPage with Suspense */}
        <Route path="/admin" element={
          <Suspense fallback={<div>Cargando...</div>}> {/* Add a fallback UI */}
            <AdminPage />
          </Suspense>
        } />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/pago-exitoso" element={<PaymentSuccessPage />} />
        <Route path="/pedido-pendiente/:id" element={<TransferPendingPage />} />
        <Route path="/cambios-y-devoluciones" element={<ReturnsPolicyPage />} />
        <Route path="/nuestra-mision" element={<NuestraMisionPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      </Routes>
    </main>
  );
};

// New MainLayout component to encapsulate the main app structure
const MainLayout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const paddingTop = isHomePage ? '' : 'pt-[80px]';
  const [isCartOpen, setIsCartOpen] = useState(false); // isCartOpen state moved here



  return (
    <div className="min-h-screen flex flex-col">
      <Header onCartClick={() => setIsCartOpen(true)} />
      <AnimatedRoutes isHomePage={isHomePage} paddingTop={paddingTop} />
      <Footer />
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
      {isHomePage && !isCartOpen && <WhatsAppButton message="¡Hola! ¿Podrían ayudarme con una consulta?" />}
    </div>
  );
};


function App() {
  const auth = useAuthProvider();
  // location, isHomePage, paddingTop, isCartOpen state moved to MainLayout



  return (
    <AuthContext.Provider value={auth}>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <MainLayout /> {/* Render MainLayout here */}
        </Router>
      </CartProvider>
    </AuthContext.Provider>
  );
}

export default App;
