import { patientService } from './patientService';
import { appointmentService } from './appointmentService';
import { doctorService } from './doctorService';
import { laboratoryService } from './laboratoryService';
import { prescriptionService } from './prescriptionService';
import { billingService } from './billingService';
import { activityService } from './activityService';
import { dateFromToday } from '@/utils/date';
import type { User, EnrichedAppointment } from '@/types';

export interface DashboardData {
  metrics: {
    totalPatients: number;
    todaysAppointments: number;
    availableDoctors: number;
    pendingLabTests: number;
    pendingPrescriptions: number;
    todayRevenue: number;
  };
  appointmentTrend: Array<{
    day: string;
    label: string;
    scheduled: number;
    completed: number;
    cancelled: number;
  }>;
  patientStats: Array<{ month: string; new: number; returning: number }>;
  todaysAppointments: EnrichedAppointment[];
  recentPatients: Array<{
    id: string;
    name: string;
    phone: string;
    registrationDate: string;
    bloodGroup: string;
  }>;
  recentActivity: Array<{ id: string; type: string; title: string; description: string; time: string; user: string }>;
}

export const dashboardService = {
  /**
   * Aggregates everything the dashboard needs from the individual services —
   * the same shape a real `/dashboard/summary` endpoint would return.
   */
  async getDashboardData(user: User | null): Promise<DashboardData> {
    const [
      patients,
      appointments,
      doctors,
      labTests,
      prescriptions,
      revenueToday,
      trend,
      activity,
    ] = await Promise.all([
      patientService.getPatients(),
      appointmentService.getAppointments(),
      doctorService.getDoctors(),
      laboratoryService.getLabTests(),
      prescriptionService.getPrescriptions(),
      billingService.getRevenueToday(),
      appointmentService.getAppointmentTrend(),
      activityService.getRecentActivity(9),
    ]);

    const today = dateFromToday(0);
    const isDoctor = user?.role === 'doctor';

    let todaysList = appointments.filter((a) => a.date === today);
    if (isDoctor && user) {
      const doctor = doctors.find((d) => d.name === user.name);
      if (doctor) todaysList = todaysList.filter((a) => a.doctorId === doctor.id);
    }
    todaysList.sort((a, b) => a.time.localeCompare(b.time));

    const recentPatients = [...patients]
      .sort((a, b) => b.registrationDate.localeCompare(a.registrationDate))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        phone: p.phone,
        registrationDate: p.registrationDate,
        bloodGroup: p.bloodGroup,
      }));

    const sixMonths: Array<{ month: string; new: number; returning: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('en-GB', { month: 'short' });
      sixMonths.push({
        month: label,
        new: Math.round(60 + Math.random() * 28),
        returning: Math.round(115 + Math.random() * 55),
      });
    }

    return {
      metrics: {
        totalPatients: patients.length,
        todaysAppointments: appointments.filter((a) => a.date === today).length,
        availableDoctors: doctors.filter((d) => d.availability === 'available' && d.status === 'active').length,
        pendingLabTests: labTests.filter((t) => t.status !== 'completed').length,
        pendingPrescriptions: prescriptions.filter((p) => p.status === 'active').length,
        todayRevenue: revenueToday,
      },
      appointmentTrend: trend,
      patientStats: sixMonths,
      todaysAppointments: todaysList.slice(0, 6),
      recentPatients,
      recentActivity: activity,
    };
  },
};
