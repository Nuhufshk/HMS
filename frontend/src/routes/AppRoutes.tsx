import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingState } from '@/components/ui/States';
import { ProtectedLayout, RoleGuard } from './guards';
import { rolesForPath } from '@/constants/navigation';

/* Route-level code splitting — each page loads on demand. */
const Login = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const PatientsList = lazy(() => import('@/pages/patients/PatientsList').then((m) => ({ default: m.PatientsList })));
const PatientProfile = lazy(() => import('@/pages/patients/PatientProfile').then((m) => ({ default: m.PatientProfile })));
const Appointments = lazy(() => import('@/pages/appointments/Appointments').then((m) => ({ default: m.Appointments })));
const Doctors = lazy(() => import('@/pages/doctors/Doctors').then((m) => ({ default: m.Doctors })));
const DoctorProfile = lazy(() => import('@/pages/doctors/DoctorProfile').then((m) => ({ default: m.DoctorProfile })));
const Nurses = lazy(() => import('@/pages/nurses/Nurses').then((m) => ({ default: m.Nurses })));
const Departments = lazy(() => import('@/pages/departments/Departments').then((m) => ({ default: m.Departments })));
const Pharmacy = lazy(() => import('@/pages/pharmacy/Pharmacy').then((m) => ({ default: m.Pharmacy })));
const Medicines = lazy(() => import('@/pages/pharmacy/Medicines').then((m) => ({ default: m.Medicines })));
const PharmacyPrescriptions = lazy(() => import('@/pages/pharmacy/PharmacyPrescriptions').then((m) => ({ default: m.PharmacyPrescriptions })));
const Laboratory = lazy(() => import('@/pages/laboratory/Laboratory').then((m) => ({ default: m.Laboratory })));
const LabTestDetails = lazy(() => import('@/pages/laboratory/LabTestDetails').then((m) => ({ default: m.LabTestDetails })));
const MedicalRecords = lazy(() => import('@/pages/medical-records/MedicalRecords').then((m) => ({ default: m.MedicalRecords })));
const PatientMedicalRecord = lazy(() => import('@/pages/medical-records/PatientMedicalRecord').then((m) => ({ default: m.PatientMedicalRecord })));
const Prescriptions = lazy(() => import('@/pages/prescriptions/Prescriptions').then((m) => ({ default: m.Prescriptions })));
const Billing = lazy(() => import('@/pages/billing/Billing').then((m) => ({ default: m.Billing })));
const BedManagement = lazy(() => import('@/pages/bed-management/Beds').then((m) => ({ default: m.Beds })));
const Reports = lazy(() => import('@/pages/reports/Reports').then((m) => ({ default: m.Reports })));
const Staff = lazy(() => import('@/pages/staff/Staff').then((m) => ({ default: m.Staff })));
const Settings = lazy(() => import('@/pages/settings/Settings').then((m) => ({ default: m.Settings })));
const Profile = lazy(() => import('@/pages/profile/Profile').then((m) => ({ default: m.Profile })));
const NotFound = lazy(() => import('@/pages/errors/NotFound').then((m) => ({ default: m.NotFound })));

function PageFallback() {
  return <LoadingState label="Loading…" />;
}

/**
 * Central route table. Each protected route is wrapped in a <RoleGuard>
 * that consults the role permissions defined in constants/navigation.ts.
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<RoleGuard roles={rolesForPath('/dashboard')}><Dashboard /></RoleGuard>} />
          <Route path="/patients" element={<RoleGuard roles={rolesForPath('/patients')}><PatientsList /></RoleGuard>} />
          <Route path="/patients/:id" element={<RoleGuard roles={rolesForPath('/patients')}><PatientProfile /></RoleGuard>} />
          <Route path="/appointments" element={<RoleGuard roles={rolesForPath('/appointments')}><Appointments /></RoleGuard>} />
          <Route path="/doctors" element={<RoleGuard roles={rolesForPath('/doctors')}><Doctors /></RoleGuard>} />
          <Route path="/doctors/:id" element={<RoleGuard roles={rolesForPath('/doctors')}><DoctorProfile /></RoleGuard>} />
          <Route path="/nurses" element={<RoleGuard roles={rolesForPath('/nurses')}><Nurses /></RoleGuard>} />
          <Route path="/departments" element={<RoleGuard roles={rolesForPath('/departments')}><Departments /></RoleGuard>} />

          <Route path="/pharmacy" element={<RoleGuard roles={rolesForPath('/pharmacy')}><Pharmacy /></RoleGuard>}>
            <Route index element={<Navigate to="/pharmacy/medicines" replace />} />
            <Route path="medicines" element={<Medicines />} />
            <Route path="prescriptions" element={<PharmacyPrescriptions />} />
          </Route>

          <Route path="/laboratory" element={<RoleGuard roles={rolesForPath('/laboratory')}><Laboratory /></RoleGuard>} />
          <Route path="/laboratory/:id" element={<RoleGuard roles={rolesForPath('/laboratory')}><LabTestDetails /></RoleGuard>} />
          <Route path="/medical-records" element={<RoleGuard roles={rolesForPath('/medical-records')}><MedicalRecords /></RoleGuard>} />
          <Route path="/medical-records/:id" element={<RoleGuard roles={rolesForPath('/medical-records')}><PatientMedicalRecord /></RoleGuard>} />
          <Route path="/prescriptions" element={<RoleGuard roles={rolesForPath('/prescriptions')}><Prescriptions /></RoleGuard>} />
          <Route path="/billing" element={<RoleGuard roles={rolesForPath('/billing')}><Billing /></RoleGuard>} />
          <Route path="/bed-management" element={<RoleGuard roles={rolesForPath('/bed-management')}><BedManagement /></RoleGuard>} />
          <Route path="/reports" element={<RoleGuard roles={rolesForPath('/reports')}><Reports /></RoleGuard>} />
          <Route path="/staff" element={<RoleGuard roles={rolesForPath('/staff')}><Staff /></RoleGuard>} />
          <Route path="/profile" element={<RoleGuard roles={rolesForPath('/profile')}><Profile /></RoleGuard>} />
          <Route path="/settings" element={<RoleGuard roles={rolesForPath('/settings')}><Settings /></RoleGuard>} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
