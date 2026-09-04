import type { AppNotification } from '../types';
import { dateTimeFromToday } from '../utils/date';

const T = (hoursAgo: number) => {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NTF-001',
    type: 'lab',
    title: 'Lab result available',
    message: 'Full Blood Count result for Kwame Osei-Bonsu (PT-1021) is ready for review.',
    time: T(0.5),
    read: false,
    link: '/laboratory/LAB-8001',
  },
  {
    id: 'NTF-002',
    type: 'appointment',
    title: 'New appointment scheduled',
    message: 'Akua Afriyie booked an antenatal check-up with Dr. Kwame Asante tomorrow at 10:00.',
    time: T(1),
    read: false,
    link: '/appointments',
  },
  {
    id: 'NTF-003',
    type: 'pharmacy',
    title: 'Low stock alert',
    message: 'Insulin Glargine 100IU/ml pen is below reorder level (38 remaining).',
    time: T(2.5),
    read: false,
    link: '/pharmacy/medicines',
  },
  {
    id: 'NTF-004',
    type: 'billing',
    title: 'Payment received',
    message: 'GH₵ 255.50 received from Kwame Osei-Bonsu for invoice INV-10421.',
    time: T(3),
    read: false,
    link: '/billing',
  },
  {
    id: 'NTF-005',
    type: 'patient',
    title: 'New patient registered',
    message: 'Ama Nyarko (PT-1036) was registered at the front desk today.',
    time: T(4),
    read: true,
    link: '/patients/PT-1036',
  },
  {
    id: 'NTF-006',
    type: 'appointment',
    title: 'Appointment completed',
    message: 'Hypertension review with Nana Osei Tutu was marked as completed.',
    time: T(5),
    read: true,
    link: '/appointments',
  },
  {
    id: 'NTF-007',
    type: 'pharmacy',
    title: 'Expired stock detected',
    message: 'Ferrous sulfate 200mg batch FS-1120 has expired and should be quarantined.',
    time: T(8),
    read: true,
    link: '/pharmacy/medicines',
  },
  {
    id: 'NTF-008',
    type: 'lab',
    title: 'STAT test processing',
    message: 'Troponin I for Kweku Appiah (PT-1013) is being processed urgently.',
    time: T(9),
    read: true,
    link: '/laboratory/LAB-8013',
  },
  {
    id: 'NTF-009',
    type: 'billing',
    title: 'Invoice overdue',
    message: 'Invoice INV-10425 (Fiifi Coleman) is now overdue by 3 days.',
    time: T(26),
    read: true,
    link: '/billing',
  },
  {
    id: 'NTF-010',
    type: 'system',
    title: 'System maintenance',
    message: 'Scheduled maintenance on the patient portal this Sunday, 02:00 – 04:00.',
    time: T(30),
    read: true,
  },
];
