import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import RoleLayout from './components/layout/RoleLayout';

import CitizenDashboard from './pages/citizen/Dashboard';
import NewCase from './pages/citizen/NewCase';
import CitizenCaseDetail from './pages/citizen/CaseDetail';
import DocumentUpload from './pages/citizen/DocumentUpload';
import BookAppointment from './pages/citizen/BookAppointment';

import VolunteerDashboard from './pages/volunteer/Dashboard';
import VolunteerCaseDetail from './pages/volunteer/CaseDetail';
import VolunteerAvailability from './pages/volunteer/Availability';

import CaseloadOverview from './pages/supervisor/CaseloadOverview';
import SupervisorCaseDetail from './pages/supervisor/CaseDetail';

import Reports from './pages/admin/Reports';
import UserManagement from './pages/admin/UserManagement';

const ROLE_HOME: Record<string, string> = {
  citizen: '/citizen',
  volunteer: '/volunteer',
  supervisor: '/supervisor',
  admin: '/admin',
};

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<RoleRoute roles={['citizen']} />}>
          <Route element={<RoleLayout />}>
            <Route path="/citizen" element={<CitizenDashboard />} />
            <Route path="/citizen/new-case" element={<NewCase />} />
            <Route path="/citizen/cases/:id" element={<CitizenCaseDetail />} />
            <Route path="/citizen/cases/:id/documents" element={<DocumentUpload />} />
            <Route path="/citizen/cases/:id/book" element={<BookAppointment />} />
          </Route>
        </Route>

        <Route element={<RoleRoute roles={['volunteer']} />}>
          <Route element={<RoleLayout />}>
            <Route path="/volunteer" element={<VolunteerDashboard />} />
            <Route path="/volunteer/cases/:id" element={<VolunteerCaseDetail />} />
            <Route path="/volunteer/availability" element={<VolunteerAvailability />} />
          </Route>
        </Route>

        <Route element={<RoleRoute roles={['supervisor']} />}>
          <Route element={<RoleLayout />}>
            <Route path="/supervisor" element={<CaseloadOverview />} />
            <Route path="/supervisor/cases/:id" element={<SupervisorCaseDetail />} />
          </Route>
        </Route>

        <Route element={<RoleRoute roles={['admin']} />}>
          <Route element={<RoleLayout />}>
            <Route path="/admin" element={<Reports />} />
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
