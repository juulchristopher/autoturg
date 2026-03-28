import { HashRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from '@/context/DataContext';
import { AuthProvider } from '@/context/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Overview from '@/pages/Overview';
import Comparison from '@/pages/Comparison';
import VehicleLookup from '@/pages/VehicleLookup';
import DataStatus from '@/pages/DataStatus';
import Privacy from '@/pages/Privacy';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <div className="flex min-h-screen bg-background">
              {/* Desktop sidebar - hidden on mobile */}
              <Sidebar />

              {/* Main content */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile nav */}
                <MobileNav />

                <Routes>
                  <Route path="/" element={<Overview />} />
                  <Route path="/comparison" element={<Comparison />} />
                  <Route path="/vehicle" element={<VehicleLookup />} />
                  <Route path="/status" element={<DataStatus />} />
                  <Route path="/privacy" element={<Privacy />} />
                </Routes>
              </div>
            </div>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </HashRouter>
  );
}
