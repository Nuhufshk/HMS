import type { ActivityItem } from '../types';
import { dateTimeFromToday } from '../utils/date';

const T = (hoursAgo: number, minuteOffset = 0) => {
  const d = new Date(dateTimeFromToday(0, 8, 0));
  d.setHours(d.getHours() - hoursAgo + Math.floor(minuteOffset / 60));
  d.setMinutes(minuteOffset % 60);
  return d.toISOString();
};

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'ACT-001',
    type: 'lab',
    title: 'Lab result uploaded',
    description: 'FBC result for Kwame Osei-Bonsu marked completed.',
    time: T(0, 25),
    user: 'Ama Agyeman',
  },
  {
    id: 'ACT-002',
    type: 'payment',
    title: 'Payment received',
    description: 'GH₵ 255.50 via Mobile Money on invoice INV-10421.',
    time: T(0, 55),
    user: 'Akua Tetteh',
  },
  {
    id: 'ACT-003',
    type: 'patient',
    title: 'Patient registered',
    description: 'Ama Nyarko (PT-1036) registered at reception.',
    time: T(1, 20),
    user: 'Abena Boakye',
  },
  {
    id: 'ACT-004',
    type: 'prescription',
    title: 'Prescription created',
    description: 'RX-6001 for Efua Akosua Boateng — asthma management.',
    time: T(2, 10),
    user: 'Dr. Efua Gyamfi',
  },
  {
    id: 'ACT-005',
    type: 'appointment',
    title: 'Appointment completed',
    description: 'Immunisation follow-up for Akosua Fofie completed.',
    time: T(3, 5),
    user: 'Dr. Nana Ama Agyeman',
  },
  {
    id: 'ACT-006',
    type: 'pharmacy',
    title: 'Prescription dispensed',
    description: 'RX-6003 dispensed to Kwesi Adu (3 items).',
    time: T(4, 30),
    user: 'Yaw Osei',
  },
  {
    id: 'ACT-007',
    type: 'lab',
    title: 'Sample collected',
    description: 'Blood sample collected for HbA1c — Yaa Achiaa.',
    time: T(5, 45),
    user: 'Emmanuel Cudjoe',
  },
  {
    id: 'ACT-008',
    type: 'appointment',
    title: 'Appointment cancelled',
    description: 'Asthma review for Efua Akosua Boateng cancelled.',
    time: T(7, 15),
    user: 'Akua Tetteh',
  },
  {
    id: 'ACT-009',
    type: 'billing',
    title: 'Invoice created',
    description: 'INV-10422 issued to Fiifi Coleman (GH₵ 500.00).',
    time: T(8, 40),
    user: 'Akua Tetteh',
  },
  {
    id: 'ACT-010',
    type: 'patient',
    title: 'Patient admitted',
    description: 'Ekow Blankson (PT-1025) admitted to General Ward 1C.',
    time: T(26, 10),
    user: 'Abena Owusu',
  },
  {
    id: 'ACT-011',
    type: 'prescription',
    title: 'Prescription created',
    description: 'RX-6019 for Fiifi Coleman — losartan initiated.',
    time: T(28, 5),
    user: 'Dr. Kwabena Osei',
  },
  {
    id: 'ACT-012',
    type: 'system',
    title: 'Stock adjustment',
    description: 'Daily stock count completed; 2 items below reorder level.',
    time: T(30, 20),
    user: 'Adjoa Sarpong',
  },
];
