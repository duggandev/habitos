import React from "react";
import { SignedIn, useAuth } from "@clerk/clerk-react";

import { Header } from "../../landing/Header";
import { Hero } from "../../landing/Hero";
import { Features } from "../../landing/Features";
import { About } from "../../landing/About";
import { Descargas } from "../../landing/Descargas";
import { FAQ } from "../../landing/FAQ";
import { Footer } from "../../landing/Footer";
import { Auth } from "../../Frontend/pages/Auth";
import ErrorView from "../components/Error/ErrorView";
import ClearCache from "../components/ui/ClearCache";

import MainLayout from "../layouts/MainLayout";
import Inicio from "../layouts/inicio/inicio";
import Dashboard from "../layouts/dashboard/Dashboard";
import Reportes from "../layouts/reportes/reportes";
import Beneficios from "../layouts/beneficios/beneficios";
import SettingsPage from "../layouts/ajustes/ajustes";

import NuevaActividadModal from "../components/modals/NuevaActividadModal";
import NuevoHabitoGrupal from "../components/modals/NuevoHabitoGrupal";
import JoinGroupInvitation from "../components/modals/JoinGroupInvitation";
import HabitoGrupalDetalle from "../components/habits/HabitoGrupalDetalle";
import GrupoDetalle from "../pages/grupos/GrupoDetalle";
import GruposPage from "../pages/grupos/GruposPage";
import { HabitsProvider } from "../layouts/state/HabitsContext";
import { SubscriptionProvider } from "../layouts/state/SubscriptionContext";
import { Route, Routes, useNavigate } from "react-router-dom";
import HabitDetailView from "../layouts/inicio/detalles";
import ProcesoDePago from "../layouts/beneficios/pagos";
import SearchResults from "../pages/SearchResults";
import Facturacion from "../layouts/facturacion/Facturacion";


// ---------- Landing ----------
const LandingPage = () => {
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isSignedIn) navigate("/dashboard");
  }, [isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <Header
        onLoginClick={() => setShowLoginModal(true)}
        onRegisterClick={() => setShowRegisterModal(true)}
      />
      <Hero onRegisterClick={() => setShowRegisterModal(true)} />
      <Features />
      <Descargas />
      <About />
      <FAQ />
      <Footer />

      {showLoginModal && <Auth mode="signIn" onClose={() => setShowLoginModal(false)} />}
      {showRegisterModal && <Auth mode="signUp" onClose={() => setShowRegisterModal(false)} />}
    </div>
  );
};

// ---------- Protected Wrapper (con provider + layout) ----------
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <ErrorView
        title="Acceso denegado"
        message="Necesitas iniciar sesión para acceder a esta página."
        showLoginButton={true}
      />
    );
  }

  return (
    <SignedIn>
      <SubscriptionProvider>
        <HabitsProvider>
          <MainLayout>
            <Routes>
              <Route path="/search" element={<SearchResults />} />
              <Route path="*" element={children} />
            </Routes>
          </MainLayout>
        </HabitsProvider>
      </SubscriptionProvider>
    </SignedIn>
  );
};

// ---------- Rutas ----------
const AppRoutes = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isSignedIn && window.location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

  return (
    <Routes>
      <Route
        path="*"
        element={
          isSignedIn ? (
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          ) : (
            <LandingPage />
          )
        }
      />

      {/* Home (lista) */}
      <Route
        path="/home/*"
        element={
          <ProtectedLayout>
            <Inicio />
          </ProtectedLayout>
        }
      />

      {/* Detalles del hábito */}
      <Route
        path="/home/habit/:habitId"
        element={
          <ProtectedLayout>
            <HabitDetailView />
          </ProtectedLayout>
        }
      />

      {/* Nueva Actividad (página, no modal) */}
      <Route
        path="/home/nueva"
        element={
          <ProtectedLayout>
            <NuevaActividadModal />
          </ProtectedLayout>
        }
      />
      
      {/* Nuevo Hábito Grupal (página, no modal) */}
      <Route
        path="/home/grupal"
        element={
          <ProtectedLayout>
            <NuevoHabitoGrupal onSuccess={() => {}} />
          </ProtectedLayout>
        }
      />

      {/* Otras secciones protegidas */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedLayout>
            <Reportes />
          </ProtectedLayout>
        }
      />
      <Route
        path="/perks"
        element={
          <ProtectedLayout>
            <Beneficios />
          </ProtectedLayout>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedLayout>
            <Facturacion />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedLayout>
            <SettingsPage />
          </ProtectedLayout>
        }
      />

      {/* Rutas de grupos */}
      <Route
        path="/dashboard/grupal"
        element={
          <ProtectedLayout>
            <GruposPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/dashboard/grupal/:id"
        element={
          <ProtectedLayout>
            <GrupoDetalle />
          </ProtectedLayout>
        }
      />
      
      {/* Ruta para detalles de un hábito grupal específico */}
      <Route
        path="/dashboard/grupal/habit/:id"
        element={
          <ProtectedLayout>
            <HabitoGrupalDetalle />
          </ProtectedLayout>
        }
      />
      
      <Route
        path="/join-group"
        element={
          <ProtectedLayout>
            <JoinGroupInvitation />
          </ProtectedLayout>
        }
      />

      {/* Ruta de pagos */}
      <Route
        path="/perks/payment"
        element={
          <ProtectedLayout>
            <ProcesoDePago />
          </ProtectedLayout>
        }
      />

      {/* Ruta para procesar invitaciones a grupos */}
      <Route
        path="/join-group"
        element={
          <ProtectedLayout>
            <JoinGroupInvitation />
          </ProtectedLayout>
        }
      />

      {/* Ruta para limpiar caché - sin protección para que funcione siempre */}
      <Route
        path="/clearcookies"
        element={
          <div className="min-h-screen bg-gray-900">
            <ClearCache />
          </div>
        }
      />

      {/* Página de error para rutas no encontradas */}
      <Route 
        path="*" 
        element={
          <ErrorView 
            title="Página no encontrada"
            message="Lo sentimos, la página que buscas no existe. Puedes volver al inicio o iniciar sesión si aún no lo has hecho."
          />
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
