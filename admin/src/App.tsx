import type { ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { useSelector } from 'react-redux';
import type { RootState } from './app/store';
import OrderDetails from './pages/OrderDetails';
import Orders from './pages/Orders';
import Quotes from './pages/Quotes';
import Blogs from './pages/Blogs';
import SocialLinks from './pages/SocialLinks';
import POS from './pages/POS';
import Banners from './pages/Banners';
import Categories from './pages/Categories';
import Users from './pages/Users';
import UserEdit from './pages/UserEdit';
import Books from './pages/Books';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import BarcodePrinter from './pages/BarcodePrinter';
import Reports from './pages/Reports';
import Kanban from './pages/Kanban';
import Expenses from './pages/Expenses';
import Supplies from './pages/Supplies';
import Branches from './pages/Branches';
import AdminLayout from './pages/AdminLayout';

// Protected Route Component
const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Permission Route Wrapper
const PermissionRoute = ({ children, moduleId }: { children: ReactElement, moduleId: string }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  const hasPermission = user.role === 'superadmin' || user.isAdmin || user.permissions?.includes(moduleId);

  if (!hasPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* All Dashboard Routes wrapped in AdminLayout */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="users" element={
            <PermissionRoute moduleId="users">
              <Users />
            </PermissionRoute>
          } />
          <Route path="users/:id/edit" element={
            <PermissionRoute moduleId="users">
              <UserEdit />
            </PermissionRoute>
          } />

          <Route path="orders" element={
            <PermissionRoute moduleId="orders">
              <Orders />
            </PermissionRoute>
          } />

          <Route path="books" element={
            <PermissionRoute moduleId="books">
              <Books />
            </PermissionRoute>
          } />

          <Route path="categories" element={
            <PermissionRoute moduleId="categories">
              <Categories />
            </PermissionRoute>
          } />

          <Route path="banners" element={
            <PermissionRoute moduleId="banners">
              <Banners />
            </PermissionRoute>
          } />

          <Route path="quotes" element={
            <PermissionRoute moduleId="quotes">
              <Quotes />
            </PermissionRoute>
          } />

          <Route path="blogs" element={
            <PermissionRoute moduleId="blogs">
              <Blogs />
            </PermissionRoute>
          } />

          <Route path="links" element={
            <PermissionRoute moduleId="links">
              <SocialLinks />
            </PermissionRoute>
          } />

          <Route path="pos" element={
            <PermissionRoute moduleId="pos">
              <POS />
            </PermissionRoute>
          } />

          <Route path="barcodes" element={
            <PermissionRoute moduleId="barcodes">
              <BarcodePrinter />
            </PermissionRoute>
          } />

          <Route path="reports" element={
            <PermissionRoute moduleId="reports">
              <Reports />
            </PermissionRoute>
          } />

          <Route path="kanban" element={
            <PermissionRoute moduleId="kanban">
              <Kanban />
            </PermissionRoute>
          } />

          <Route path="expenses" element={
            <PermissionRoute moduleId="expenses">
              <Expenses />
            </PermissionRoute>
          } />

          <Route path="supplies" element={
            <PermissionRoute moduleId="supplies">
              <Supplies />
            </PermissionRoute>
          } />

          <Route path="settings" element={
            <PermissionRoute moduleId="settings">
              <Settings />
            </PermissionRoute>
          } />

          <Route path="branches" element={
            <PermissionRoute moduleId="branches">
              <Branches />
            </PermissionRoute>
          } />

          <Route path="orders/:id" element={
            <PermissionRoute moduleId="orders">
              <OrderDetails />
            </PermissionRoute>
          } />

          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
