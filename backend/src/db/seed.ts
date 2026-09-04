import 'dotenv/config';
import { pool, db } from './index';
import {
  users, departments, doctors, nurses, patients, appointments,
  medicines, prescriptions, labTests, medicalRecords, invoices,
  staff, notifications, wards, beds, bedAssignments,
} from './schema';
import { dateFromToday, dateTimeFromToday, daysUntil } from '../utils/date';
import { hashPassword } from '../utils/password';

const D = (offset: number) => dateFromToday(offset);
const DT = (offset: number, hour: number, minute = 0) => dateTimeFromToday(offset, hour, minute);
const T = (hoursAgo: number) => { const d = new Date(); d.setHours(d.getHours() - hoursAgo); return d.toISOString(); };

const ROLE_LABELS: Record<string, string> = { admin: 'Administrator', doctor: 'Doctor', nurse: 'Nurse', receptionist: 'Receptionist', pharmacist: 'Pharmacist', lab_technician: 'Laboratory Technician', accountant: 'Accountant' };

const MOCK_USERS = [
  { id: 'USR-001', name: 'Dr. Akosua Adjei', email: 'admin@adommedicalcentre.gh', password: 'admin123', role: 'admin', roleLabel: ROLE_LABELS.admin, department: 'Administration', phone: '+233 24 100 2201', title: 'Chief Executive Officer' },
  { id: 'USR-002', name: 'Dr. Kofi Boateng', email: 'doctor@adommedicalcentre.gh', password: 'doctor123', role: 'doctor', roleLabel: ROLE_LABELS.doctor, department: 'General Medicine', phone: '+233 24 100 2202', title: 'Consultant Physician' },
  { id: 'USR-003', name: 'Efua Mensah', email: 'nurse@adommedicalcentre.gh', password: 'nurse123', role: 'nurse', roleLabel: ROLE_LABELS.nurse, department: 'Maternity', phone: '+233 24 100 2203', title: 'Senior Staff Nurse' },
  { id: 'USR-004', name: 'Akua Tetteh', email: 'reception@adommedicalcentre.gh', password: 'reception123', role: 'receptionist', roleLabel: ROLE_LABELS.receptionist, department: 'Front Desk', phone: '+233 24 100 2204', title: 'Front Desk Officer' },
  { id: 'USR-005', name: 'Yaw Osei', email: 'pharmacy@adommedicalcentre.gh', password: 'pharmacy123', role: 'pharmacist', roleLabel: ROLE_LABELS.pharmacist, department: 'Pharmacy', phone: '+233 24 100 2205', title: 'Chief Pharmacist' },
  { id: 'USR-006', name: 'Ama Agyeman', email: 'lab@adommedicalcentre.gh', password: 'lab123', role: 'lab_technician', roleLabel: ROLE_LABELS.lab_technician, department: 'Laboratory', phone: '+233 24 100 2206', title: 'Senior Laboratory Technician' },
  { id: 'USR-007', name: 'Kwabena Frimpong', email: 'accountant@adommedicalcentre.gh', password: 'accountant123', role: 'accountant', roleLabel: ROLE_LABELS.accountant, department: 'Finance', phone: '+233 24 100 2207', title: 'Chief Accountant' },
];

const MOCK_DEPARTMENTS = [
  { id: 'GEN', name: 'General Medicine', code: 'GEN', headName: 'Dr. Kofi Boateng', headId: 'DR-101', doctors: 2, nurses: 6, patients: 284, status: 'active', location: 'Ground Floor, Block A', phone: '+233 30 276 1301', description: 'Provides diagnosis and non-surgical treatment of diseases in adults, including outpatient clinics and medical ward rounds.' },
  { id: 'PED', name: 'Pediatrics', code: 'PED', headName: 'Dr. Ama Serwaa Owusu', headId: 'DR-102', doctors: 2, nurses: 5, patients: 198, status: 'active', location: 'First Floor, Block B', phone: '+233 30 276 1302', description: 'Child health services including newborn care, immunisation, growth monitoring and treatment of childhood illnesses.' },
  { id: 'CAR', name: 'Cardiology', code: 'CAR', headName: 'Dr. Kwabena Osei', headId: 'DR-103', doctors: 1, nurses: 3, patients: 132, status: 'active', location: 'Second Floor, Block A', phone: '+233 30 276 1303', description: 'Diagnosis and management of heart conditions, hypertension, heart failure and echocardiography services.' },
  { id: 'NEU', name: 'Neurology', code: 'NEU', headName: 'Dr. Efua Gyamfi', headId: 'DR-104', doctors: 1, nurses: 3, patients: 96, status: 'active', location: 'Second Floor, Block B', phone: '+233 30 276 1304', description: 'Management of nervous system disorders including epilepsy, migraine, stroke and neuro-rehabilitation.' },
  { id: 'EME', name: 'Emergency', code: 'EME', headName: 'Dr. Yaw Frimpong', headId: 'DR-105', doctors: 2, nurses: 8, patients: 412, status: 'active', location: 'Ground Floor, Main Entrance', phone: '+233 30 276 1999', description: '24-hour accident and emergency services, triage, resuscitation and short-stay observation.' },
  { id: 'SUR', name: 'Surgery', code: 'SUR', headName: 'Dr. Abena Akoto', headId: 'DR-106', doctors: 2, nurses: 6, patients: 121, status: 'active', location: 'Third Floor, Block A', phone: '+233 30 276 1306', description: 'General and laparoscopic surgery, operating theatres, pre-operative and post-operative care.' },
  { id: 'MAT', name: 'Maternity', code: 'MAT', headName: 'Dr. Kwame Asante', headId: 'DR-107', doctors: 1, nurses: 9, patients: 167, status: 'active', location: 'First Floor, Block A', phone: '+233 30 276 1307', description: 'Antenatal, delivery and postnatal care, including the maternity ward, labour suite and well-baby checks.' },
  { id: 'LAB', name: 'Laboratory', code: 'LAB', headName: 'Ama Agyeman', headId: 'STF-404', doctors: 0, nurses: 0, patients: 0, status: 'active', location: 'Ground Floor, Block B', phone: '+233 30 276 1308', description: 'Clinical diagnostics: haematology, biochemistry, microbiology, serology and parasitology services.' },
  { id: 'PHA', name: 'Pharmacy', code: 'PHA', headName: 'Yaw Osei', headId: 'STF-403', doctors: 0, nurses: 0, patients: 0, status: 'active', location: 'Ground Floor, Main Atrium', phone: '+233 30 276 1309', description: 'Dispensing of prescribed medication, medicine inventory management and patient medication counselling.' },
  { id: 'RAD', name: 'Radiology', code: 'RAD', headName: 'Dr. Kweku Ansah', headId: 'DR-110', doctors: 1, nurses: 2, patients: 88, status: 'active', location: 'First Floor, Block C', phone: '+233 30 276 1310', description: 'Diagnostic imaging including X-ray, ultrasound, CT scanning and fluoroscopy with consultant reporting.' },
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const FULL_WEEK = [...WEEKDAYS, 'Saturday'];

const MOCK_DOCTORS = [
  { id: 'DR-101', name: 'Dr. Kofi Boateng', specialization: 'General Medicine', departmentId: 'GEN', phone: '+233 24 421 7810', email: 'kofi.boateng@adommedicalcentre.gh', status: 'active', availability: 'available', joinedDate: '2016-03-14', schedule: WEEKDAYS.map((day) => ({ day, hours: '08:00 – 16:00' })), about: 'Consultant physician with 15 years of experience in internal and general medicine.' },
  { id: 'DR-102', name: 'Dr. Ama Serwaa Owusu', specialization: 'Pediatrics', departmentId: 'PED', phone: '+233 20 118 4532', email: 'ama.owusu@adommedicalcentre.gh', status: 'active', availability: 'available', joinedDate: '2018-08-02', schedule: WEEKDAYS.map((day) => ({ day, hours: '08:00 – 16:00' })), about: 'Pediatrician specialising in child health, immunisation and growth monitoring.' },
  { id: 'DR-103', name: 'Dr. Kwabena Osei', specialization: 'Cardiology', departmentId: 'CAR', phone: '+233 26 774 1098', email: 'kwabena.osei@adommedicalcentre.gh', status: 'active', availability: 'busy', joinedDate: '2015-01-19', schedule: [...WEEKDAYS.map((day) => ({ day, hours: '09:00 – 17:00' })), { day: 'Saturday', hours: '09:00 – 13:00' }], about: 'Interventional cardiologist with a focus on hypertension management and echocardiography.' },
  { id: 'DR-104', name: 'Dr. Efua Gyamfi', specialization: 'Neurology', departmentId: 'NEU', phone: '+233 54 330 6621', email: 'efua.gyamfi@adommedicalcentre.gh', status: 'active', availability: 'available', joinedDate: '2019-05-27', schedule: WEEKDAYS.map((day) => ({ day, hours: '08:30 – 16:30' })), about: 'Neurologist specialising in epilepsy, migraine and stroke care.' },
  { id: 'DR-105', name: 'Dr. Yaw Frimpong', specialization: 'Emergency Medicine', departmentId: 'EME', phone: '+233 27 556 8901', email: 'yaw.frimpong@adommedicalcentre.gh', status: 'active', availability: 'available', joinedDate: '2014-11-10', schedule: FULL_WEEK.map((day) => ({ day, hours: 'Rotating 12h shifts' })), about: 'Emergency physician leading the Accident & Emergency unit.' },
  { id: 'DR-106', name: 'Dr. Abena Akoto', specialization: 'General Surgery', departmentId: 'SUR', phone: '+233 24 667 3309', email: 'abena.akoto@adommedicalcentre.gh', status: 'active', availability: 'busy', joinedDate: '2017-07-03', schedule: WEEKDAYS.map((day) => ({ day, hours: '07:30 – 15:30' })), about: 'General surgeon with experience in laparoscopic and emergency surgery.' },
  { id: 'DR-107', name: 'Dr. Kwame Asante', specialization: 'Obstetrics & Gynaecology', departmentId: 'MAT', phone: '+233 20 992 4510', email: 'kwame.asante@adommedicalcentre.gh', status: 'active', availability: 'available', joinedDate: '2016-02-22', schedule: [...WEEKDAYS.map((day) => ({ day, hours: '08:00 – 16:00' })), { day: 'Saturday', hours: '08:00 – 12:00' }], about: 'Obstetrician and gynaecologist heading the Maternity unit.' },
  { id: 'DR-108', name: 'Dr. Adwoa Mensah', specialization: 'Internal Medicine', departmentId: 'GEN', phone: '+233 26 118 7745', email: 'adwoa.mensah@adommedicalcentre.gh', status: 'active', availability: 'available', joinedDate: '2020-09-14', schedule: WEEKDAYS.map((day) => ({ day, hours: '08:00 – 16:00' })), about: 'Internal medicine specialist with a keen interest in diabetes and endocrine disorders.' },
  { id: 'DR-109', name: 'Dr. Nana Ama Agyeman', specialization: 'Pediatrics', departmentId: 'PED', phone: '+233 54 221 9087', email: 'nanaama.agyeman@adommedicalcentre.gh', status: 'active', availability: 'available', joinedDate: '2021-01-11', schedule: WEEKDAYS.map((day) => ({ day, hours: '09:00 – 17:00' })), about: 'Pediatrician focused on neonatal care and childhood nutrition.' },
  { id: 'DR-110', name: 'Dr. Kweku Ansah', specialization: 'Radiology', departmentId: 'RAD', phone: '+233 24 809 3342', email: 'kweku.ansah@adommedicalcentre.gh', status: 'active', availability: 'busy', joinedDate: '2013-10-05', schedule: WEEKDAYS.map((day) => ({ day, hours: '08:00 – 16:00' })), about: 'Radiologist heading the Radiology & Imaging unit.' },
  { id: 'DR-111', name: 'Dr. Kojo Amankwah', specialization: 'Emergency Medicine', departmentId: 'EME', phone: '+233 27 450 6623', email: 'kojo.amankwah@adommedicalcentre.gh', status: 'active', availability: 'away', joinedDate: '2022-04-18', schedule: FULL_WEEK.map((day) => ({ day, hours: 'Rotating 12h shifts' })), about: 'Emergency medicine physician supporting the Accident & Emergency unit.' },
  { id: 'DR-112', name: 'Dr. Yaa Danso', specialization: 'General Surgery', departmentId: 'SUR', phone: '+233 20 335 8091', email: 'yaa.danso@adommedicalcentre.gh', status: 'on_leave', availability: 'away', joinedDate: '2021-06-01', schedule: WEEKDAYS.map((day) => ({ day, hours: '08:00 – 16:00' })), about: 'General surgeon covering ward rounds, theatre and outpatient surgical clinics.' },
];

const MOCK_NURSES = [
  { id: 'NS-301', name: 'Efua Mensah', departmentId: 'MAT', phone: '+233 24 502 8831', email: 'efua.mensah@adommedicalcentre.gh', shift: 'Morning', ward: 'Maternity Ward 2A', status: 'active', joinedDate: '2017-05-15' },
  { id: 'NS-302', name: 'Akosua Tetteh', departmentId: 'PED', phone: '+233 20 887 3410', email: 'akosua.tetteh@adommedicalcentre.gh', shift: 'Afternoon', ward: 'Paediatric Ward 1B', status: 'active', joinedDate: '2019-02-11' },
  { id: 'NS-303', name: 'Emmanuel Cudjoe', departmentId: 'EME', phone: '+233 26 441 9207', email: 'emmanuel.cudjoe@adommedicalcentre.gh', shift: 'Night', ward: 'Emergency Bay', status: 'active', joinedDate: '2020-08-24' },
  { id: 'NS-304', name: 'Abena Owusu', departmentId: 'GEN', phone: '+233 54 220 7618', email: 'abena.owusu@adommedicalcentre.gh', shift: 'Morning', ward: 'General Ward 1C', status: 'active', joinedDate: '2018-11-05' },
  { id: 'NS-305', name: 'Adjoa Lamptey', departmentId: 'SUR', phone: '+233 24 118 4502', email: 'adjoa.lamptey@adommedicalcentre.gh', shift: 'Afternoon', ward: 'Surgical Ward 3B', status: 'active', joinedDate: '2021-03-22' },
  { id: 'NS-306', name: 'Michael Ofori', departmentId: 'CAR', phone: '+233 20 665 2910', email: 'michael.ofori@adommedicalcentre.gh', shift: 'Night', ward: 'Cardiology Unit', status: 'active', joinedDate: '2022-01-17' },
  { id: 'NS-307', name: 'Esther Boakye', departmentId: 'NEU', phone: '+233 26 774 1088', email: 'esther.boakye@adommedicalcentre.gh', shift: 'Rotating', ward: 'Neurology Ward', status: 'inactive', joinedDate: '2019-09-09' },
  { id: 'NS-308', name: 'Grace Addo', departmentId: 'MAT', phone: '+233 54 336 7750', email: 'grace.addo@adommedicalcentre.gh', shift: 'Rotating', ward: 'Postnatal Ward 2B', status: 'active', joinedDate: '2023-04-03' },
];

const reg = (monthsAgo: number, day = 10) => dateFromToday(-Math.round(monthsAgo * 30) - (day % 20));

const MOCK_PATIENTS = [
  { id: 'PT-1001', firstName: 'Kwame', lastName: 'Osei-Bonsu', dateOfBirth: '1985-04-12', gender: 'Male', phone: '+233 24 552 7810', email: 'kwame.oseibonsu@gmail.com', address: '14 Nima Highway', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: ['Penicillin'], conditions: ['Hypertension'], emergencyContact: { name: 'Adwoa Osei-Bonsu', relationship: 'Wife', phone: '+233 24 552 7811' }, insurance: { provider: 'NHIS', number: 'NHIS/2019/045678' }, registrationDate: reg(7, 3), assignedDoctorId: 'DR-103', status: 'active', type: 'returning' },
  { id: 'PT-1002', firstName: 'Ama Serwaa', lastName: 'Asante', dateOfBirth: '1992-11-03', gender: 'Female', phone: '+233 20 118 4532', email: 'amaserwaa.asante@yahoo.com', address: '22 Asokwa Road', city: 'Kumasi', nationality: 'Ghanaian', bloodGroup: 'A+', genotype: 'AA', allergies: [], conditions: [], emergencyContact: { name: 'Kwabena Asante', relationship: 'Brother', phone: '+233 20 118 4533' }, insurance: { provider: 'NHIS', number: 'NHIS/2021/112390' }, registrationDate: reg(6, 8), assignedDoctorId: 'DR-102', status: 'active', type: 'returning' },
  { id: 'PT-1003', firstName: 'Kofi', lastName: 'Mensah', dateOfBirth: '1978-07-21', gender: 'Male', phone: '+233 26 774 1098', email: 'kofi.mensah@outlook.com', address: '8 Community 25', city: 'Tema', nationality: 'Ghanaian', bloodGroup: 'B+', genotype: 'AS', allergies: [], conditions: ['Type 2 Diabetes'], emergencyContact: { name: 'Esi Mensah', relationship: 'Wife', phone: '+233 26 774 1099' }, insurance: { provider: 'NHIS', number: 'NHIS/2020/078231' }, registrationDate: reg(6, 15), assignedDoctorId: 'DR-108', status: 'active', type: 'returning' },
  { id: 'PT-1004', firstName: 'Efua Akosua', lastName: 'Boateng', dateOfBirth: '1989-02-14', gender: 'Female', phone: '+233 54 330 6621', email: 'efua.boateng@gmail.com', address: '3 Abura Road', city: 'Cape Coast', nationality: 'Ghanaian', bloodGroup: 'O-', genotype: 'AA', allergies: ['Sulfonamides'], conditions: ['Asthma'], emergencyContact: { name: 'Kojo Boateng', relationship: 'Father', phone: '+233 54 330 6622' }, insurance: { provider: 'NHIS', number: 'NHIS/2022/091105' }, registrationDate: reg(5, 2), assignedDoctorId: 'DR-104', status: 'active', type: 'returning' },
  { id: 'PT-1005', firstName: 'Yaw', lastName: 'Owusu-Ansah', dateOfBirth: '1966-09-30', gender: 'Male', phone: '+233 27 556 8901', email: 'yaw.owusuansah@gmail.com', address: '11 Market Circle', city: 'Takoradi', nationality: 'Ghanaian', bloodGroup: 'AB+', genotype: 'AA', allergies: [], conditions: ['Hypertension', 'Osteoarthritis'], emergencyContact: { name: 'Akua Owusu-Ansah', relationship: 'Daughter', phone: '+233 27 556 8902' }, insurance: { provider: 'Apex Health', number: 'APH-77810-2' }, registrationDate: reg(5, 18), assignedDoctorId: 'DR-101', status: 'active', type: 'returning' },
  { id: 'PT-1006', firstName: 'Abena Afia', lastName: 'Adjei', dateOfBirth: '2001-12-05', gender: 'Female', phone: '+233 24 667 3309', email: 'abena.adjei@gmail.com', address: '9 East Legon', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: [], conditions: [], emergencyContact: { name: 'Yaw Adjei', relationship: 'Father', phone: '+233 24 667 3310' }, insurance: { provider: 'NHIS', number: 'NHIS/2023/134556' }, registrationDate: reg(5, 25), assignedDoctorId: 'DR-102', status: 'active', type: 'returning' },
  { id: 'PT-1007', firstName: 'Nana Kwaku', lastName: 'Agyeman', dateOfBirth: '1958-06-17', gender: 'Male', phone: '+233 20 992 4510', email: 'nanakwaku.agyeman@gmail.com', address: '5 Asafo Market', city: 'Kumasi', nationality: 'Ghanaian', bloodGroup: 'B-', genotype: 'AS', allergies: ['Codeine'], conditions: ['Hypertension', 'Peptic Ulcer Disease'], emergencyContact: { name: 'Nana Adwoa Agyeman', relationship: 'Wife', phone: '+233 20 992 4511' }, insurance: { provider: 'NHIS', number: 'NHIS/2018/056789' }, registrationDate: reg(4, 6), assignedDoctorId: 'DR-101', status: 'active', type: 'returning' },
  { id: 'PT-1008', firstName: 'Adjoa Baaba', lastName: 'Darko', dateOfBirth: '1995-03-28', gender: 'Female', phone: '+233 26 118 7745', email: 'adjoa.darko@gmail.com', address: '17 Polytechnic Road', city: 'Koforidua', nationality: 'Ghanaian', bloodGroup: 'A+', genotype: 'AA', allergies: [], conditions: ['Migraine'], emergencyContact: { name: 'Kofi Darko', relationship: 'Husband', phone: '+233 26 118 7746' }, insurance: { provider: 'NHIS', number: 'NHIS/2021/145677' }, registrationDate: reg(4, 14), assignedDoctorId: 'DR-104', status: 'active', type: 'returning' },
  { id: 'PT-1009', firstName: 'Kojo', lastName: 'Tetteh', dateOfBirth: '1983-08-09', gender: 'Male', phone: '+233 54 221 9087', email: 'kojo.tetteh@gmail.com', address: '25 Spintex Road', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: [], conditions: ['Gastroesophageal Reflux Disease'], emergencyContact: { name: 'Ama Tetteh', relationship: 'Wife', phone: '+233 54 221 9088' }, insurance: { provider: 'NHIS', number: 'NHIS/2020/087654' }, registrationDate: reg(4, 22), assignedDoctorId: 'DR-108', status: 'active', type: 'returning' },
  { id: 'PT-1010', firstName: 'Akosua', lastName: 'Gyamfi', dateOfBirth: '1974-01-25', gender: 'Female', phone: '+233 24 809 3342', email: 'akosua.gyamfi@yahoo.com', address: '6 Sunyani Road', city: 'Sunyani', nationality: 'Ghanaian', bloodGroup: 'AB-', genotype: 'AA', allergies: [], conditions: ['Type 2 Diabetes', 'Hypertension'], emergencyContact: { name: 'Kwame Gyamfi', relationship: 'Son', phone: '+233 24 809 3343' }, insurance: { provider: 'NHIS', number: 'NHIS/2019/065432' }, registrationDate: reg(3, 3), assignedDoctorId: 'DR-108', status: 'active', type: 'returning' },
  { id: 'PT-1011', firstName: 'Kwabena', lastName: 'Amoako', dateOfBirth: '1998-10-11', gender: 'Male', phone: '+233 27 450 6623', email: 'kwabena.amoako@gmail.com', address: '19 Community 11', city: 'Tema', nationality: 'Ghanaian', bloodGroup: 'B+', genotype: 'AA', allergies: [], conditions: [], emergencyContact: { name: 'Akosua Amoako', relationship: 'Mother', phone: '+233 27 450 6624' }, insurance: null, registrationDate: reg(3, 11), assignedDoctorId: 'DR-105', status: 'active', type: 'new' },
  { id: 'PT-1012', firstName: 'Esi Awo', lastName: 'Frimpong', dateOfBirth: '1990-05-19', gender: 'Female', phone: '+233 20 335 8091', email: 'esi.frimpong@gmail.com', address: '2 Osu Ako-Adjei', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: ['Latex'], conditions: [], emergencyContact: { name: 'Kofi Frimpong', relationship: 'Husband', phone: '+233 20 335 8092' }, insurance: { provider: 'NHIS', number: 'NHIS/2022/102938' }, registrationDate: reg(3, 19), assignedDoctorId: 'DR-107', status: 'active', type: 'returning' },
  { id: 'PT-1013', firstName: 'Kweku', lastName: 'Appiah', dateOfBirth: '1971-12-02', gender: 'Male', phone: '+233 24 502 8831', email: 'kweku.appiah@gmail.com', address: '13 Asokwa Estate', city: 'Kumasi', nationality: 'Ghanaian', bloodGroup: 'A-', genotype: 'AS', allergies: [], conditions: ['Hypertension'], emergencyContact: { name: 'Adwoa Appiah', relationship: 'Wife', phone: '+233 24 502 8832' }, insurance: { provider: 'Premier Health', number: 'PH-22109-7' }, registrationDate: reg(3, 27), assignedDoctorId: 'DR-103', status: 'admitted', type: 'returning' },
  { id: 'PT-1014', firstName: 'Maame Yaa', lastName: 'Sarpong', dateOfBirth: '2005-07-07', gender: 'Female', phone: '+233 20 887 3410', email: 'maame.sarpong@gmail.com', address: '30 Madina Zongo', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: [], conditions: ['Sickle Cell Trait'], emergencyContact: { name: 'Yaw Sarpong', relationship: 'Father', phone: '+233 20 887 3411' }, insurance: { provider: 'NHIS', number: 'NHIS/2023/156732' }, registrationDate: reg(2, 4), assignedDoctorId: 'DR-102', status: 'active', type: 'new' },
  { id: 'PT-1015', firstName: 'Nii Okai', lastName: 'Odamtten', dateOfBirth: '1987-04-22', gender: 'Male', phone: '+233 26 441 9207', email: 'niiokai.odamtten@gmail.com', address: '7 Ga Mashie', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'B+', genotype: 'AA', allergies: [], conditions: ['Low Back Pain'], emergencyContact: { name: 'Adoley Odamtten', relationship: 'Sister', phone: '+233 26 441 9208' }, insurance: { provider: 'NHIS', number: 'NHIS/2020/093847' }, registrationDate: reg(2, 12), assignedDoctorId: 'DR-106', status: 'active', type: 'returning' },
  { id: 'PT-1016', firstName: 'Adoley', lastName: 'Quaye', dateOfBirth: '1969-11-13', gender: 'Female', phone: '+233 54 220 7618', email: 'adoley.quaye@gmail.com', address: '5 Teshie Nungua', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'A+', genotype: 'AA', allergies: [], conditions: ['Hypertension', 'Hypothyroidism'], emergencyContact: { name: 'Tetteh Quaye', relationship: 'Son', phone: '+233 54 220 7619' }, insurance: { provider: 'NHIS', number: 'NHIS/2018/034521' }, registrationDate: reg(2, 20), assignedDoctorId: 'DR-108', status: 'active', type: 'returning' },
  { id: 'PT-1017', firstName: 'Kobina', lastName: 'Eshun', dateOfBirth: '1993-06-30', gender: 'Male', phone: '+233 24 118 4502', email: 'kobina.eshun@gmail.com', address: '16 University Road', city: 'Cape Coast', nationality: 'Ghanaian', bloodGroup: 'O-', genotype: 'AA', allergies: ['Peanuts'], conditions: ['Asthma'], emergencyContact: { name: 'Araba Eshun', relationship: 'Mother', phone: '+233 24 118 4503' }, insurance: { provider: 'NHIS', number: 'NHIS/2021/118203' }, registrationDate: reg(2, 28), assignedDoctorId: 'DR-104', status: 'active', type: 'returning' },
  { id: 'PT-1018', firstName: 'Araba', lastName: 'Annan', dateOfBirth: '1984-02-27', gender: 'Female', phone: '+233 20 665 2910', email: 'araba.annan@gmail.com', address: '4 Harbour Road', city: 'Sekondi-Takoradi', nationality: 'Ghanaian', bloodGroup: 'AB+', genotype: 'AA', allergies: [], conditions: [], emergencyContact: { name: 'Kobina Annan', relationship: 'Husband', phone: '+233 20 665 2911' }, insurance: { provider: 'Mine Workers Trust', number: 'MWT-90871-4' }, registrationDate: reg(1, 5), assignedDoctorId: 'DR-107', status: 'active', type: 'returning' },
  { id: 'PT-1019', firstName: 'Kwesi', lastName: 'Adu', dateOfBirth: '2008-09-15', gender: 'Male', phone: '+233 26 774 1088', email: '', address: '21 Bantama Road', city: 'Kumasi', nationality: 'Ghanaian', bloodGroup: 'B+', genotype: 'AS', allergies: [], conditions: ['Recurrent Malaria'], emergencyContact: { name: 'Akua Adu', relationship: 'Mother', phone: '+233 26 774 1089' }, insurance: { provider: 'NHIS', number: 'NHIS/2023/172645' }, registrationDate: reg(1, 13), assignedDoctorId: 'DR-109', status: 'active', type: 'new' },
  { id: 'PT-1020', firstName: 'Akua', lastName: 'Afriyie', dateOfBirth: '1997-08-08', gender: 'Female', phone: '+233 54 336 7750', email: 'akua.afriyie@gmail.com', address: '10 Dansoman Estates', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: [], conditions: [], emergencyContact: { name: 'Kwame Afriyie', relationship: 'Father', phone: '+233 54 336 7751' }, insurance: { provider: 'NHIS', number: 'NHIS/2022/134890' }, registrationDate: reg(1, 21), assignedDoctorId: 'DR-107', status: 'active', type: 'new' },
  { id: 'PT-1021', firstName: 'Owusu', lastName: 'Kwadwo', dateOfBirth: '1962-03-16', gender: 'Male', phone: '+233 24 552 1004', email: 'owusu.kwadwo@gmail.com', address: '12 Bank Street', city: 'Obuasi', nationality: 'Ghanaian', bloodGroup: 'A+', genotype: 'AA', allergies: [], conditions: ['Hypertension', 'Gout'], emergencyContact: { name: 'Afia Kwadwo', relationship: 'Wife', phone: '+233 24 552 1005' }, insurance: { provider: 'NHIS', number: 'NHIS/2017/021349' }, registrationDate: reg(0, 6), assignedDoctorId: 'DR-101', status: 'active', type: 'returning' },
  { id: 'PT-1022', firstName: 'Yaa', lastName: 'Achiaa', dateOfBirth: '1979-12-24', gender: 'Female', phone: '+233 20 118 6671', email: 'yaa.achiaa@gmail.com', address: '3 Ahodwo', city: 'Kumasi', nationality: 'Ghanaian', bloodGroup: 'B-', genotype: 'AA', allergies: [], conditions: ['Type 2 Diabetes'], emergencyContact: { name: 'Kwaku Achiaa', relationship: 'Brother', phone: '+233 20 118 6672' }, insurance: { provider: 'NHIS', number: 'NHIS/2020/087732' }, registrationDate: reg(0, 9), assignedDoctorId: 'DR-108', status: 'active', type: 'returning' },
  { id: 'PT-1023', firstName: 'Fiifi', lastName: 'Coleman', dateOfBirth: '1990-01-18', gender: 'Male', phone: '+233 26 774 5503', email: 'fiifi.coleman@gmail.com', address: '9 Winneba Road', city: 'Winneba', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: [], conditions: ['Hypertension'], emergencyContact: { name: 'Efua Coleman', relationship: 'Wife', phone: '+233 26 774 5504' }, insurance: { provider: 'NHIS', number: 'NHIS/2021/145778' }, registrationDate: reg(0, 12), assignedDoctorId: 'DR-103', status: 'active', type: 'new' },
  { id: 'PT-1024', firstName: 'Ama', lastName: 'Konadu', dateOfBirth: '1994-04-04', gender: 'Female', phone: '+233 54 220 3348', email: 'ama.konadu@gmail.com', address: '15 North Kaneshie', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'A+', genotype: 'AA', allergies: [], conditions: [], emergencyContact: { name: 'Kofi Konadu', relationship: 'Father', phone: '+233 54 220 3349' }, insurance: { provider: 'NHIS', number: 'NHIS/2023/160023' }, registrationDate: reg(0, 15), assignedDoctorId: 'DR-102', status: 'active', type: 'new' },
  { id: 'PT-1025', firstName: 'Ekow', lastName: 'Blankson', dateOfBirth: '1975-07-29', gender: 'Male', phone: '+233 24 118 9920', email: 'ekow.blankson@gmail.com', address: '6 Community 8', city: 'Tema', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: [], conditions: ['Hypertension', 'Type 2 Diabetes'], emergencyContact: { name: 'Abena Blankson', relationship: 'Wife', phone: '+233 24 118 9921' }, insurance: { provider: 'NHIS', number: 'NHIS/2019/054321' }, registrationDate: reg(0, 18), assignedDoctorId: 'DR-108', status: 'admitted', type: 'returning' },
  { id: 'PT-1026', firstName: 'Afia', lastName: 'Pokuaa', dateOfBirth: '1988-10-05', gender: 'Female', phone: '+233 20 665 7784', email: 'afia.pokuaa@gmail.com', address: '11 Nsawam Road', city: 'Nsawam', nationality: 'Ghanaian', bloodGroup: 'AB+', genotype: 'AA', allergies: ['Penicillin'], conditions: ['Asthma'], emergencyContact: { name: 'Yaw Pokuaa', relationship: 'Husband', phone: '+233 20 665 7785' }, insurance: { provider: 'NHIS', number: 'NHIS/2022/129004' }, registrationDate: reg(0, 21), assignedDoctorId: 'DR-104', status: 'active', type: 'new' },
  { id: 'PT-1027', firstName: 'Kofi', lastName: 'Antwi', dateOfBirth: '1996-05-23', gender: 'Male', phone: '+233 26 441 2083', email: 'kofi.antwi@gmail.com', address: '27 Adenta New Road', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'B+', genotype: 'AA', allergies: [], conditions: ['Peptic Ulcer Disease'], emergencyContact: { name: 'Ama Antwi', relationship: 'Mother', phone: '+233 26 441 2084' }, insurance: null, registrationDate: reg(0, 24), assignedDoctorId: 'DR-108', status: 'active', type: 'new' },
  { id: 'PT-1028', firstName: 'Serwaa', lastName: 'Asamoah', dateOfBirth: '1982-06-11', gender: 'Female', phone: '+233 54 336 5510', email: 'serwaa.asamoah@gmail.com', address: '8 Madina Estates', city: 'Madina', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: [], conditions: ['Migraine', 'Anaemia'], emergencyContact: { name: 'Kwabena Asamoah', relationship: 'Husband', phone: '+233 54 336 5511' }, insurance: { provider: 'NHIS', number: 'NHIS/2020/076543' }, registrationDate: reg(0, 27), assignedDoctorId: 'DR-104', status: 'active', type: 'new' },
  { id: 'PT-1029', firstName: 'Nana Osei', lastName: 'Tutu', dateOfBirth: '1952-08-02', gender: 'Male', phone: '+233 24 552 6672', email: '', address: '2 KNUST Campus', city: 'Kumasi', nationality: 'Ghanaian', bloodGroup: 'A-', genotype: 'AS', allergies: ['Sulfonamides'], conditions: ['Hypertension', 'Chronic Kidney Disease'], emergencyContact: { name: 'Nana Ama Tutu', relationship: 'Daughter', phone: '+233 24 552 6673' }, insurance: { provider: 'NHIS', number: 'NHIS/2018/048291' }, registrationDate: reg(0, 30), assignedDoctorId: 'DR-103', status: 'active', type: 'returning' },
  { id: 'PT-1030', firstName: 'Akosua', lastName: 'Fofie', dateOfBirth: '2003-02-19', gender: 'Female', phone: '+233 20 118 4409', email: 'akosua.fofie@gmail.com', address: '19 Legon Botanical', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: [], conditions: [], emergencyContact: { name: 'Kwame Fofie', relationship: 'Father', phone: '+233 20 118 4410' }, insurance: { provider: 'NHIS', number: 'NHIS/2023/183456' }, registrationDate: reg(0, 2), assignedDoctorId: 'DR-109', status: 'active', type: 'new' },
  { id: 'PT-1031', firstName: 'Yaw', lastName: 'Dapaah', dateOfBirth: '1981-11-27', gender: 'Male', phone: '+233 26 774 1185', email: 'yaw.dapaah@gmail.com', address: '7 Ashaiman Middle East', city: 'Ashaiman', nationality: 'Ghanaian', bloodGroup: 'B+', genotype: 'AA', allergies: [], conditions: ['Hypertension'], emergencyContact: { name: 'Efua Dapaah', relationship: 'Wife', phone: '+233 26 774 1186' }, insurance: { provider: 'NHIS', number: 'NHIS/2021/110876' }, registrationDate: reg(0, 4), assignedDoctorId: 'DR-101', status: 'discharged', type: 'returning' },
  { id: 'PT-1032', firstName: 'Efua', lastName: 'Sey', dateOfBirth: '1991-09-09', gender: 'Female', phone: '+233 54 220 9963', email: 'efua.sey@gmail.com', address: '5 Sekondi Road', city: 'Takoradi', nationality: 'Ghanaian', bloodGroup: 'A+', genotype: 'AA', allergies: [], conditions: ['Asthma'], emergencyContact: { name: 'Kobina Sey', relationship: 'Father', phone: '+233 54 220 9964' }, insurance: { provider: 'NHIS', number: 'NHIS/2022/141237' }, registrationDate: reg(0, 7), assignedDoctorId: 'DR-104', status: 'active', type: 'new' },
  { id: 'PT-1033', firstName: 'Kwame', lastName: 'Boadu', dateOfBirth: '1970-04-20', gender: 'Male', phone: '+233 24 118 7756', email: 'kwame.boadu@gmail.com', address: '10 Osu Reindolf', city: 'Accra', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: [], conditions: ['Type 2 Diabetes'], emergencyContact: { name: 'Adwoa Boadu', relationship: 'Wife', phone: '+233 24 118 7757' }, insurance: { provider: 'Premier Health', number: 'PH-55401-2' }, registrationDate: reg(0, 10), assignedDoctorId: 'DR-108', status: 'active', type: 'returning' },
  { id: 'PT-1034', firstName: 'Abena', lastName: 'Koranteng', dateOfBirth: '1986-07-12', gender: 'Female', phone: '+233 20 665 2238', email: 'abena.koranteng@gmail.com', address: '14 Koforidua New Town', city: 'Koforidua', nationality: 'Ghanaian', bloodGroup: 'B+', genotype: 'AA', allergies: [], conditions: ['Hypertension'], emergencyContact: { name: 'Yaw Koranteng', relationship: 'Husband', phone: '+233 20 665 2239' }, insurance: { provider: 'NHIS', number: 'NHIS/2020/065890' }, registrationDate: reg(0, 13), assignedDoctorId: 'DR-103', status: 'active', type: 'new' },
  { id: 'PT-1035', firstName: 'Kweku', lastName: 'Sakyi', dateOfBirth: '1999-01-30', gender: 'Male', phone: '+233 26 441 7761', email: 'kweku.sakyi@gmail.com', address: '3 Ho Main Road', city: 'Ho', nationality: 'Ghanaian', bloodGroup: 'AB+', genotype: 'AA', allergies: [], conditions: ['Recurrent Malaria'], emergencyContact: { name: 'Ama Sakyi', relationship: 'Mother', phone: '+233 26 441 7762' }, insurance: null, registrationDate: reg(0, 16), assignedDoctorId: 'DR-105', status: 'active', type: 'new' },
  { id: 'PT-1036', firstName: 'Ama', lastName: 'Nyarko', dateOfBirth: '1993-12-01', gender: 'Female', phone: '+233 54 336 1187', email: 'ama.nyarko@gmail.com', address: '6 Education Ridge', city: 'Tamale', nationality: 'Ghanaian', bloodGroup: 'O+', genotype: 'AA', allergies: [], conditions: [], emergencyContact: { name: 'Kwame Nyarko', relationship: 'Brother', phone: '+233 54 336 1188' }, insurance: { provider: 'NHIS', number: 'NHIS/2023/194528' }, registrationDate: reg(0, 19), assignedDoctorId: 'DR-107', status: 'active', type: 'new' },
];

const MOCK_APPOINTMENTS = [
  { id: 'APT-5001', patientId: 'PT-1021', doctorId: 'DR-101', departmentId: 'GEN', date: D(0), time: '08:00', reason: 'Hypertension review', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5002', patientId: 'PT-1023', doctorId: 'DR-103', departmentId: 'CAR', date: D(0), time: '08:30', reason: 'Chest discomfort', type: 'Consultation', status: 'completed' },
  { id: 'APT-5003', patientId: 'PT-1030', doctorId: 'DR-109', departmentId: 'PED', date: D(0), time: '09:00', reason: 'Immunisation follow-up', type: 'Check-up', status: 'in_progress' },
  { id: 'APT-5004', patientId: 'PT-1006', doctorId: 'DR-102', departmentId: 'PED', date: D(0), time: '09:30', reason: 'Persistent cough', type: 'Consultation', status: 'waiting' },
  { id: 'APT-5005', patientId: 'PT-1025', doctorId: 'DR-108', departmentId: 'GEN', date: D(0), time: '10:00', reason: 'Diabetes management', type: 'Follow-up', status: 'waiting' },
  { id: 'APT-5006', patientId: 'PT-1012', doctorId: 'DR-107', departmentId: 'MAT', date: D(0), time: '10:30', reason: 'Antenatal check-up', type: 'Maternity', status: 'scheduled' },
  { id: 'APT-5007', patientId: 'PT-1008', doctorId: 'DR-104', departmentId: 'NEU', date: D(0), time: '11:00', reason: 'Migraine follow-up', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5008', patientId: 'PT-1032', doctorId: 'DR-104', departmentId: 'NEU', date: D(0), time: '11:30', reason: 'Asthma review', type: 'Review', status: 'scheduled' },
  { id: 'APT-5009', patientId: 'PT-1017', doctorId: 'DR-106', departmentId: 'SUR', date: D(0), time: '13:00', reason: 'Post-op wound review', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5010', patientId: 'PT-1001', doctorId: 'DR-103', departmentId: 'CAR', date: D(0), time: '14:00', reason: 'Blood pressure re-check', type: 'Check-up', status: 'scheduled' },
  { id: 'APT-5011', patientId: 'PT-1002', doctorId: 'DR-102', departmentId: 'PED', date: D(-1), time: '09:00', reason: 'Childhood vaccination', type: 'Check-up', status: 'completed' },
  { id: 'APT-5012', patientId: 'PT-1029', doctorId: 'DR-103', departmentId: 'CAR', date: D(-1), time: '10:00', reason: 'Heart failure review', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5013', patientId: 'PT-1015', doctorId: 'DR-106', departmentId: 'SUR', date: D(-1), time: '11:00', reason: 'Hernia consultation', type: 'Consultation', status: 'cancelled' },
  { id: 'APT-5014', patientId: 'PT-1034', doctorId: 'DR-103', departmentId: 'CAR', date: D(-1), time: '13:30', reason: 'Palpitations', type: 'Consultation', status: 'completed' },
  { id: 'APT-5015', patientId: 'PT-1020', doctorId: 'DR-107', departmentId: 'MAT', date: D(-1), time: '14:00', reason: 'Antenatal check-up', type: 'Maternity', status: 'completed' },
  { id: 'APT-5016', patientId: 'PT-1011', doctorId: 'DR-105', departmentId: 'EME', date: D(-1), time: '15:00', reason: 'Road traffic accident review', type: 'Emergency', status: 'completed' },
  { id: 'APT-5017', patientId: 'PT-1028', doctorId: 'DR-104', departmentId: 'NEU', date: D(-2), time: '09:30', reason: 'Recurrent headaches', type: 'Consultation', status: 'completed' },
  { id: 'APT-5018', patientId: 'PT-1004', doctorId: 'DR-104', departmentId: 'NEU', date: D(-2), time: '10:30', reason: 'Asthma management plan', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5019', patientId: 'PT-1019', doctorId: 'DR-109', departmentId: 'PED', date: D(-2), time: '11:30', reason: 'Malaria treatment review', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5020', patientId: 'PT-1009', doctorId: 'DR-108', departmentId: 'GEN', date: D(-2), time: '14:30', reason: 'Acid reflux follow-up', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5021', patientId: 'PT-1035', doctorId: 'DR-105', departmentId: 'EME', date: D(-3), time: '12:00', reason: 'Severe headache, fever', type: 'Emergency', status: 'completed' },
  { id: 'APT-5022', patientId: 'PT-1003', doctorId: 'DR-108', departmentId: 'GEN', date: D(-3), time: '09:00', reason: 'Diabetes & foot check', type: 'Check-up', status: 'completed' },
  { id: 'APT-5023', patientId: 'PT-1022', doctorId: 'DR-108', departmentId: 'GEN', date: D(-3), time: '10:00', reason: 'Glucose monitoring review', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5024', patientId: 'PT-1013', doctorId: 'DR-103', departmentId: 'CAR', date: D(-3), time: '11:00', reason: 'Chest pain evaluation', type: 'Consultation', status: 'completed' },
  { id: 'APT-5025', patientId: 'PT-1026', doctorId: 'DR-104', departmentId: 'NEU', date: D(-4), time: '09:00', reason: 'Wheeze review', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5026', patientId: 'PT-1014', doctorId: 'DR-102', departmentId: 'PED', date: D(-4), time: '10:00', reason: 'Sickle cell trait counselling', type: 'Consultation', status: 'completed' },
  { id: 'APT-5027', patientId: 'PT-1005', doctorId: 'DR-101', departmentId: 'GEN', date: D(-4), time: '13:00', reason: 'Joint pain review', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5028', patientId: 'PT-1016', doctorId: 'DR-108', departmentId: 'GEN', date: D(-5), time: '09:30', reason: 'Thyroid function follow-up', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5029', patientId: 'PT-1007', doctorId: 'DR-101', departmentId: 'GEN', date: D(-5), time: '10:30', reason: 'Peptic ulcer review', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5030', patientId: 'PT-1033', doctorId: 'DR-108', departmentId: 'GEN', date: D(-5), time: '14:00', reason: 'Diabetes annual review', type: 'Check-up', status: 'completed' },
  { id: 'APT-5031', patientId: 'PT-1018', doctorId: 'DR-107', departmentId: 'MAT', date: D(-6), time: '09:00', reason: 'Postnatal check', type: 'Check-up', status: 'completed' },
  { id: 'APT-5032', patientId: 'PT-1024', doctorId: 'DR-102', departmentId: 'PED', date: D(-6), time: '11:00', reason: 'Family planning counselling', type: 'Consultation', status: 'completed' },
  { id: 'APT-5033', patientId: 'PT-1036', doctorId: 'DR-107', departmentId: 'MAT', date: D(-7), time: '10:00', reason: 'First antenatal visit', type: 'Maternity', status: 'completed' },
  { id: 'APT-5034', patientId: 'PT-1010', doctorId: 'DR-108', departmentId: 'GEN', date: D(-7), time: '13:30', reason: 'Hypertension & diabetes review', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5035', patientId: 'PT-1027', doctorId: 'DR-108', departmentId: 'GEN', date: D(-8), time: '09:00', reason: 'Stomach ulcer follow-up', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5036', patientId: 'PT-1031', doctorId: 'DR-101', departmentId: 'GEN', date: D(-8), time: '10:00', reason: 'Discharge review', type: 'Review', status: 'completed' },
  { id: 'APT-5037', patientId: 'PT-1002', doctorId: 'DR-102', departmentId: 'PED', date: D(-9), time: '09:00', reason: 'Well-child visit', type: 'Check-up', status: 'completed' },
  { id: 'APT-5038', patientId: 'PT-1020', doctorId: 'DR-107', departmentId: 'MAT', date: D(-9), time: '11:00', reason: 'Pelvic ultrasound review', type: 'Consultation', status: 'completed' },
  { id: 'APT-5039', patientId: 'PT-1006', doctorId: 'DR-102', departmentId: 'PED', date: D(-10), time: '09:30', reason: 'Fever and rash', type: 'Consultation', status: 'completed' },
  { id: 'APT-5040', patientId: 'PT-1025', doctorId: 'DR-108', departmentId: 'GEN', date: D(-10), time: '14:00', reason: 'Blood sugar review', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5041', patientId: 'PT-1011', doctorId: 'DR-105', departmentId: 'EME', date: D(-12), time: '16:00', reason: 'Laceration dressing', type: 'Emergency', status: 'completed' },
  { id: 'APT-5042', patientId: 'PT-1008', doctorId: 'DR-104', departmentId: 'NEU', date: D(-12), time: '09:00', reason: 'Migraine medication review', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5043', patientId: 'PT-1014', doctorId: 'DR-102', departmentId: 'PED', date: D(-13), time: '10:30', reason: 'Growth monitoring', type: 'Check-up', status: 'completed' },
  { id: 'APT-5044', patientId: 'PT-1017', doctorId: 'DR-106', departmentId: 'SUR', date: D(-14), time: '11:00', reason: 'Inguinal hernia repair consult', type: 'Consultation', status: 'completed' },
  { id: 'APT-5045', patientId: 'PT-1029', doctorId: 'DR-103', departmentId: 'CAR', date: D(-15), time: '09:00', reason: 'Echocardiogram follow-up', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5046', patientId: 'PT-1015', doctorId: 'DR-106', departmentId: 'SUR', date: D(-16), time: '13:00', reason: 'Back pain physiotherapy referral', type: 'Consultation', status: 'completed' },
  { id: 'APT-5047', patientId: 'PT-1004', doctorId: 'DR-104', departmentId: 'NEU', date: D(-17), time: '10:00', reason: 'Asthma review', type: 'Follow-up', status: 'cancelled' },
  { id: 'APT-5048', patientId: 'PT-1003', doctorId: 'DR-108', departmentId: 'GEN', date: D(-18), time: '09:30', reason: 'Diabetic foot screening', type: 'Check-up', status: 'completed' },
  { id: 'APT-5049', patientId: 'PT-1012', doctorId: 'DR-107', departmentId: 'MAT', date: D(-19), time: '14:30', reason: 'Antenatal ultrasound', type: 'Maternity', status: 'completed' },
  { id: 'APT-5050', patientId: 'PT-1026', doctorId: 'DR-104', departmentId: 'NEU', date: D(-20), time: '09:00', reason: 'Asthma & allergy review', type: 'Follow-up', status: 'completed' },
  { id: 'APT-5051', patientId: 'PT-1005', doctorId: 'DR-101', departmentId: 'GEN', date: D(1), time: '09:00', reason: 'Osteoarthritis review', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5052', patientId: 'PT-1019', doctorId: 'DR-109', departmentId: 'PED', date: D(1), time: '10:00', reason: 'Malaria prevention check', type: 'Check-up', status: 'scheduled' },
  { id: 'APT-5053', patientId: 'PT-1033', doctorId: 'DR-108', departmentId: 'GEN', date: D(1), time: '11:30', reason: 'Diabetes review', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5054', patientId: 'PT-1022', doctorId: 'DR-108', departmentId: 'GEN', date: D(2), time: '09:00', reason: 'HbA1c follow-up', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5055', patientId: 'PT-1007', doctorId: 'DR-101', departmentId: 'GEN', date: D(2), time: '10:30', reason: 'BP medication review', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5056', patientId: 'PT-1034', doctorId: 'DR-103', departmentId: 'CAR', date: D(2), time: '13:00', reason: 'ECG review', type: 'Review', status: 'scheduled' },
  { id: 'APT-5057', patientId: 'PT-1013', doctorId: 'DR-103', departmentId: 'CAR', date: D(3), time: '09:00', reason: 'Admission follow-up', type: 'Review', status: 'scheduled' },
  { id: 'APT-5058', patientId: 'PT-1020', doctorId: 'DR-107', departmentId: 'MAT', date: D(3), time: '10:00', reason: 'Antenatal check-up', type: 'Maternity', status: 'scheduled' },
  { id: 'APT-5059', patientId: 'PT-1036', doctorId: 'DR-107', departmentId: 'MAT', date: D(4), time: '09:30', reason: 'Antenatal visit', type: 'Maternity', status: 'scheduled' },
  { id: 'APT-5060', patientId: 'PT-1001', doctorId: 'DR-103', departmentId: 'CAR', date: D(4), time: '11:00', reason: 'Ambulatory BP monitoring', type: 'Procedure', status: 'scheduled' },
  { id: 'APT-5061', patientId: 'PT-1028', doctorId: 'DR-104', departmentId: 'NEU', date: D(5), time: '09:00', reason: 'Migraine treatment plan', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5062', patientId: 'PT-1018', doctorId: 'DR-107', departmentId: 'MAT', date: D(5), time: '13:30', reason: 'Gynaecological review', type: 'Consultation', status: 'scheduled' },
  { id: 'APT-5063', patientId: 'PT-1016', doctorId: 'DR-108', departmentId: 'GEN', date: D(6), time: '10:00', reason: 'Thyroid medication review', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5064', patientId: 'PT-1009', doctorId: 'DR-108', departmentId: 'GEN', date: D(6), time: '14:00', reason: 'GERD follow-up', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5065', patientId: 'PT-1024', doctorId: 'DR-102', departmentId: 'PED', date: D(7), time: '09:00', reason: 'Child health review', type: 'Check-up', status: 'scheduled' },
  { id: 'APT-5066', patientId: 'PT-1031', doctorId: 'DR-101', departmentId: 'GEN', date: D(8), time: '10:00', reason: 'Post-discharge check', type: 'Review', status: 'scheduled' },
  { id: 'APT-5067', patientId: 'PT-1011', doctorId: 'DR-105', departmentId: 'EME', date: D(8), time: '15:00', reason: 'Wound review', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5068', patientId: 'PT-1023', doctorId: 'DR-103', departmentId: 'CAR', date: D(9), time: '09:30', reason: 'Holter monitor results', type: 'Review', status: 'scheduled' },
  { id: 'APT-5069', patientId: 'PT-1032', doctorId: 'DR-104', departmentId: 'NEU', date: D(10), time: '10:00', reason: 'Asthma control review', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5070', patientId: 'PT-1027', doctorId: 'DR-108', departmentId: 'GEN', date: D(11), time: '09:00', reason: 'H. pylori review', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5071', patientId: 'PT-1002', doctorId: 'DR-102', departmentId: 'PED', date: D(12), time: '10:30', reason: 'Child immunisation', type: 'Check-up', status: 'scheduled' },
  { id: 'APT-5072', patientId: 'PT-1014', doctorId: 'DR-102', departmentId: 'PED', date: D(13), time: '09:00', reason: 'Adolescent health check', type: 'Check-up', status: 'scheduled' },
  { id: 'APT-5073', patientId: 'PT-1021', doctorId: 'DR-101', departmentId: 'GEN', date: D(14), time: '10:00', reason: 'Gout management review', type: 'Follow-up', status: 'scheduled' },
  { id: 'APT-5074', patientId: 'PT-1035', doctorId: 'DR-105', departmentId: 'EME', date: D(14), time: '14:00', reason: 'Fever clinic review', type: 'Follow-up', status: 'scheduled' },
];

function medicineStatus(quantity: number, reorderLevel: number, expiryDate: string) {
  if (daysUntil(expiryDate) <= 0) return 'expired' as const;
  if (quantity <= 0) return 'out_of_stock' as const;
  if (quantity <= reorderLevel) return 'low_stock' as const;
  return 'in_stock' as const;
}

const MOCK_MEDICINES_RAW = [
  { id: 'MED-7001', name: 'Coartem (Artemether/Lumefantrine 80/480mg)', category: 'Antimalarial', quantity: 340, reorderLevel: 100, unitPrice: 45.5, expiryDate: D(240), supplier: 'Tobinco Pharmaceuticals', batch: 'BT-2041' },
  { id: 'MED-7002', name: 'Paracetamol 500mg', category: 'Analgesic', quantity: 1250, reorderLevel: 300, unitPrice: 8.0, expiryDate: D(400), supplier: 'Ernest Chemists', batch: 'PC-8852' },
  { id: 'MED-7003', name: 'Amoxicillin 500mg', category: 'Antibiotic', quantity: 480, reorderLevel: 150, unitPrice: 18.5, expiryDate: D(210), supplier: 'Kinapharma', batch: 'AM-3340' },
  { id: 'MED-7004', name: 'Metformin 500mg', category: 'Antidiabetic', quantity: 900, reorderLevel: 200, unitPrice: 14.0, expiryDate: D(365), supplier: 'PharmaVision', batch: 'MF-2217' },
  { id: 'MED-7005', name: 'Amlodipine 5mg', category: 'Antihypertensive', quantity: 520, reorderLevel: 150, unitPrice: 16.5, expiryDate: D(300), supplier: 'M&G Pharmaceuticals', batch: 'AM-9081' },
  { id: 'MED-7006', name: 'Atorvastatin 20mg', category: 'Cardiovascular', quantity: 60, reorderLevel: 120, unitPrice: 38.0, expiryDate: D(280), supplier: 'Tobinco Pharmaceuticals', batch: 'AT-1102' },
  { id: 'MED-7007', name: 'Omeprazole 20mg', category: 'Gastrointestinal', quantity: 640, reorderLevel: 150, unitPrice: 21.0, expiryDate: D(330), supplier: 'Danadams Pharmacy', batch: 'OM-5544' },
  { id: 'MED-7008', name: 'Ibuprofen 400mg', category: 'Analgesic', quantity: 0, reorderLevel: 120, unitPrice: 12.0, expiryDate: D(180), supplier: 'Ernest Chemists', batch: 'IB-7731' },
  { id: 'MED-7009', name: 'Metronidazole 400mg', category: 'Antibiotic', quantity: 410, reorderLevel: 120, unitPrice: 15.0, expiryDate: D(220), supplier: 'Kinapharma', batch: 'MT-6670' },
  { id: 'MED-7010', name: 'Ciprofloxacin 500mg', category: 'Antibiotic', quantity: 230, reorderLevel: 100, unitPrice: 24.0, expiryDate: D(190), supplier: 'PharmaVision', batch: 'CP-3388' },
  { id: 'MED-7011', name: 'Salbutamol inhaler 100mcg', category: 'Respiratory', quantity: 85, reorderLevel: 60, unitPrice: 42.0, expiryDate: D(260), supplier: 'M&G Pharmaceuticals', batch: 'SB-4450' },
  { id: 'MED-7012', name: 'Losartan 50mg', category: 'Antihypertensive', quantity: 150, reorderLevel: 120, unitPrice: 19.5, expiryDate: D(320), supplier: 'Danadams Pharmacy', batch: 'LS-5561' },
  { id: 'MED-7013', name: 'Furosemide 40mg', category: 'Cardiovascular', quantity: 320, reorderLevel: 100, unitPrice: 11.0, expiryDate: D(240), supplier: 'Tobinco Pharmaceuticals', batch: 'FS-8890' },
  { id: 'MED-7014', name: 'Ceftriaxone 1g injection', category: 'Antibiotic', quantity: 90, reorderLevel: 60, unitPrice: 55.0, expiryDate: D(150), supplier: 'Kinapharma', batch: 'CF-1129' },
  { id: 'MED-7015', name: 'Oral Rehydration Salts (ORS)', category: 'Fluids & Electrolytes', quantity: 780, reorderLevel: 200, unitPrice: 5.5, expiryDate: D(500), supplier: 'Ernest Chemists', batch: 'OR-9920' },
  { id: 'MED-7016', name: 'Zinc sulfate 20mg', category: 'Vitamins & Supplements', quantity: 45, reorderLevel: 80, unitPrice: 9.0, expiryDate: D(210), supplier: 'PharmaVision', batch: 'ZN-3345' },
  { id: 'MED-7017', name: 'Multivitamin tablets', category: 'Vitamins & Supplements', quantity: 620, reorderLevel: 150, unitPrice: 17.0, expiryDate: D(420), supplier: 'Danadams Pharmacy', batch: 'MV-7788' },
  { id: 'MED-7018', name: 'Diclofenac 50mg', category: 'Analgesic', quantity: 0, reorderLevel: 100, unitPrice: 13.5, expiryDate: D(160), supplier: 'M&G Pharmaceuticals', batch: 'DC-5560' },
  { id: 'MED-7019', name: 'Tramadol 50mg', category: 'Analgesic', quantity: 110, reorderLevel: 60, unitPrice: 28.0, expiryDate: D(260), supplier: 'Kinapharma', batch: 'TD-2211' },
  { id: 'MED-7020', name: 'Glibenclamide 5mg', category: 'Antidiabetic', quantity: 260, reorderLevel: 100, unitPrice: 13.0, expiryDate: D(300), supplier: 'PharmaVision', batch: 'GB-8877' },
  { id: 'MED-7021', name: 'Insulin Glargine 100IU/ml pen', category: 'Antidiabetic', quantity: 38, reorderLevel: 40, unitPrice: 95.0, expiryDate: D(180), supplier: 'Tobinco Pharmaceuticals', batch: 'IG-0092' },
  { id: 'MED-7022', name: 'Aspirin 75mg', category: 'Cardiovascular', quantity: 540, reorderLevel: 150, unitPrice: 7.5, expiryDate: D(380), supplier: 'Ernest Chemists', batch: 'AS-4410' },
  { id: 'MED-7023', name: 'Cetirizine 10mg', category: 'Respiratory', quantity: 150, reorderLevel: 80, unitPrice: 10.5, expiryDate: D(200), supplier: 'Danadams Pharmacy', batch: 'CT-6681' },
  { id: 'MED-7024', name: 'Ferrous sulfate 200mg', category: 'Vitamins & Supplements', quantity: 88, reorderLevel: 100, unitPrice: 9.5, expiryDate: D(-4), supplier: 'M&G Pharmaceuticals', batch: 'FS-1120' },
  { id: 'MED-7025', name: 'Prednisolone 10mg', category: 'Respiratory', quantity: 200, reorderLevel: 80, unitPrice: 12.0, expiryDate: D(220), supplier: 'Kinapharma', batch: 'PD-3307' },
  { id: 'MED-7026', name: 'Propranolol 40mg', category: 'Cardiovascular', quantity: 130, reorderLevel: 60, unitPrice: 18.0, expiryDate: D(300), supplier: 'PharmaVision', batch: 'PP-1194' },
];

const MOCK_MEDICINES = MOCK_MEDICINES_RAW.map((m) => ({
  ...m,
  status: medicineStatus(m.quantity, m.reorderLevel, m.expiryDate),
}));

const MOCK_PRESCRIPTIONS = [
  {
    id: 'RX-6001', patientId: 'PT-1004', doctorId: 'DR-104', date: D(0), diagnosis: 'Acute asthma exacerbation', status: 'active',
    medications: [
      { name: 'Salbutamol inhaler 100mcg', dosage: '2 puffs', frequency: 'Every 6 hours', duration: '7 days', instructions: 'Inhale when breathless; maximum 8 puffs per day.' },
      { name: 'Prednisolone 20mg', dosage: '1 tablet', frequency: 'Once daily', duration: '5 days', instructions: 'Take after breakfast with food.' },
    ],
    notes: 'Return for review if symptoms persist beyond 3 days.',
  },
  {
    id: 'RX-6002', patientId: 'PT-1003', doctorId: 'DR-108', date: D(0), diagnosis: 'Type 2 diabetes mellitus', status: 'active',
    medications: [
      { name: 'Metformin 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '30 days', instructions: 'Take with meals to reduce stomach upset.' },
    ],
  },
  {
    id: 'RX-6003', patientId: 'PT-1019', doctorId: 'DR-109', date: D(-1), diagnosis: 'Uncomplicated malaria', status: 'dispensed',
    medications: [
      { name: 'Coartem (Artemether 80mg / Lumefantrine 480mg)', dosage: '1 tablet', frequency: 'Twice daily', duration: '3 days', instructions: 'Take with fatty food; complete the full course even if you feel better.' },
      { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '3 days', instructions: 'For fever and body pains.' },
    ],
  },
  {
    id: 'RX-6004', patientId: 'PT-1035', doctorId: 'DR-105', date: D(-1), diagnosis: 'Typhoid fever (presumptive)', status: 'dispensed',
    medications: [
      { name: 'Ciprofloxacin 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '10 days', instructions: 'Finish the full course. Avoid antacids within 2 hours.' },
      { name: 'ORS sachets', dosage: '1 sachet in 1L water', frequency: 'After each loose stool', duration: '3 days', instructions: 'Drink plenty of fluids.' },
    ],
  },
  {
    id: 'RX-6005', patientId: 'PT-1021', doctorId: 'DR-101', date: D(-2), diagnosis: 'Hypertension (stage 2)', status: 'dispensed',
    medications: [
      { name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Take every morning at the same time.' },
      { name: 'Losartan 50mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Take every evening.' },
    ],
  },
  {
    id: 'RX-6006', patientId: 'PT-1001', doctorId: 'DR-103', date: D(-2), diagnosis: 'Hypertension (stage 1)', status: 'dispensed',
    medications: [
      { name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily', duration: '60 days', instructions: 'Take in the morning. Monitor BP weekly.' },
    ],
  },
  {
    id: 'RX-6007', patientId: 'PT-1027', doctorId: 'DR-108', date: D(-3), diagnosis: 'Peptic ulcer disease', status: 'dispensed',
    medications: [
      { name: 'Omeprazole 20mg', dosage: '1 capsule', frequency: 'Once daily', duration: '28 days', instructions: 'Take 30 minutes before breakfast.' },
    ],
  },
  {
    id: 'RX-6008', patientId: 'PT-1015', doctorId: 'DR-106', date: D(-3), diagnosis: 'Mechanical low back pain', status: 'completed',
    medications: [
      { name: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '7 days', instructions: 'Take after meals.' },
      { name: 'Diclofenac gel 1%', dosage: 'Apply thin layer', frequency: 'Twice daily', duration: '14 days', instructions: 'Massage gently over the painful area.' },
    ],
  },
  {
    id: 'RX-6009', patientId: 'PT-1022', doctorId: 'DR-108', date: D(-4), diagnosis: 'Type 2 diabetes mellitus', status: 'active',
    medications: [
      { name: 'Glibenclamide 5mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '30 days', instructions: 'Take 30 minutes before meals. Watch for hypoglycaemia.' },
      { name: 'Metformin 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '30 days', instructions: 'Take with meals.' },
    ],
  },
  {
    id: 'RX-6010', patientId: 'PT-1028', doctorId: 'DR-104', date: D(-4), diagnosis: 'Migraine without aura', status: 'active',
    medications: [
      { name: 'Propranolol 40mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '90 days', instructions: 'Prophylaxis – do not stop abruptly.' },
    ],
  },
  {
    id: 'RX-6011', patientId: 'PT-1026', doctorId: 'DR-104', date: D(-5), diagnosis: 'Asthma – persistent', status: 'dispensed',
    medications: [
      { name: 'Salbutamol inhaler 100mcg', dosage: '2 puffs', frequency: 'As needed', duration: '30 days', instructions: 'Reliever – use as needed, up to 8 puffs daily.' },
      { name: 'Prednisolone 10mg', dosage: '1 tablet', frequency: 'Once daily', duration: '5 days', instructions: 'Short course for current flare-up.' },
    ],
  },
  {
    id: 'RX-6012', patientId: 'PT-1011', doctorId: 'DR-105', date: D(-6), diagnosis: 'Infected laceration – right forearm', status: 'dispensed',
    medications: [
      { name: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: 'Three times daily', duration: '7 days', instructions: 'Complete the full course.' },
      { name: 'Paracetamol 500mg', dosage: '2 tablets', frequency: 'Three times daily', duration: '5 days', instructions: 'For pain.' },
    ],
  },
  {
    id: 'RX-6013', patientId: 'PT-1020', doctorId: 'DR-107', date: D(-6), diagnosis: 'Antenatal – iron deficiency prophylaxis', status: 'dispensed',
    medications: [
      { name: 'Ferrous sulfate 200mg', dosage: '1 tablet', frequency: 'Once daily', duration: '90 days', instructions: 'Take with vitamin C or orange juice; may darken stools.' },
      { name: 'Folic acid 5mg', dosage: '1 tablet', frequency: 'Once daily', duration: '90 days', instructions: 'Continue through pregnancy.' },
    ],
  },
  {
    id: 'RX-6014', patientId: 'PT-1007', doctorId: 'DR-101', date: D(-7), diagnosis: 'Peptic ulcer disease + hypertension', status: 'completed',
    medications: [
      { name: 'Omeprazole 20mg', dosage: '1 capsule', frequency: 'Once daily', duration: '28 days', instructions: 'Before breakfast.' },
      { name: 'Amlodipine 10mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Morning dose.' },
    ],
  },
  {
    id: 'RX-6015', patientId: 'PT-1033', doctorId: 'DR-108', date: D(-8), diagnosis: 'Type 2 diabetes mellitus', status: 'active',
    medications: [
      { name: 'Metformin 1000mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '60 days', instructions: 'With meals. Review kidney function in 3 months.' },
    ],
  },
  {
    id: 'RX-6016', patientId: 'PT-1025', doctorId: 'DR-108', date: D(-9), diagnosis: 'Type 2 diabetes + hypertension', status: 'dispensed',
    medications: [
      { name: 'Metformin 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '30 days', instructions: 'With meals.' },
      { name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Morning.' },
      { name: 'Aspirin 75mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'After breakfast.' },
    ],
  },
  {
    id: 'RX-6017', patientId: 'PT-1009', doctorId: 'DR-108', date: D(-10), diagnosis: 'Gastroesophageal reflux disease', status: 'dispensed',
    medications: [
      { name: 'Omeprazole 20mg', dosage: '1 capsule', frequency: 'Once daily', duration: '14 days', instructions: 'Before breakfast. Avoid late-night meals.' },
    ],
  },
  {
    id: 'RX-6018', patientId: 'PT-1030', doctorId: 'DR-109', date: D(-11), diagnosis: 'Viral upper respiratory tract infection', status: 'dispensed',
    medications: [
      { name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Once daily', duration: '5 days', instructions: 'At bedtime if drowsy.' },
      { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '5 days', instructions: 'For fever.' },
    ],
  },
  {
    id: 'RX-6019', patientId: 'PT-1023', doctorId: 'DR-103', date: D(-12), diagnosis: 'Hypertension – newly diagnosed', status: 'active',
    medications: [
      { name: 'Losartan 50mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Evening dose. Low-salt diet advised.' },
    ],
  },
  {
    id: 'RX-6020', patientId: 'PT-1013', doctorId: 'DR-103', date: D(-13), diagnosis: 'Hypertensive urgency (admitted)', status: 'cancelled',
    medications: [
      { name: 'Nifedipine 20mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '14 days', instructions: 'Superseded by IV therapy during admission.' },
    ],
    notes: 'Cancelled – regimen changed to IV labetalol during admission.',
  },
];

const MOCK_LAB_TESTS = [
  { id: 'LAB-8001', patientId: 'PT-1021', doctorId: 'DR-101', testName: 'Full Blood Count', orderedDate: D(-2), sampleType: 'Blood', priority: 'routine', status: 'completed', result: '11.2', unit: 'g/dL', referenceRange: '12.0 – 16.0', notes: 'Mild anaemia; commence iron supplementation.', abnormal: true, collectedAt: DT(-2, 9, 45), completedAt: DT(-1, 14, 20) },
  { id: 'LAB-8002', patientId: 'PT-1035', doctorId: 'DR-105', testName: 'Malaria Rapid Test (RDT)', orderedDate: D(-3), sampleType: 'Blood', priority: 'urgent', status: 'completed', result: 'Negative', unit: '', referenceRange: 'Negative', notes: 'Two negative bands read correctly.', abnormal: false, collectedAt: DT(-3, 12, 15), completedAt: DT(-3, 13, 5) },
  { id: 'LAB-8003', patientId: 'PT-1019', doctorId: 'DR-109', testName: 'Malaria Rapid Test (RDT)', orderedDate: D(-2), sampleType: 'Blood', priority: 'urgent', status: 'completed', result: 'Positive – P. falciparum', unit: '', referenceRange: 'Negative', notes: 'High parasite density on film; treated with artemisinin combination.', abnormal: true, collectedAt: DT(-2, 10, 30), completedAt: DT(-2, 11, 20) },
  { id: 'LAB-8004', patientId: 'PT-1003', doctorId: 'DR-108', testName: 'Fasting Blood Sugar', orderedDate: D(-4), sampleType: 'Blood', priority: 'routine', status: 'completed', result: '7.8', unit: 'mmol/L', referenceRange: '3.9 – 6.1', notes: 'Fasting sample after 10-hour overnight fast. Consistent with diabetes.', abnormal: true, collectedAt: DT(-4, 7, 40), completedAt: DT(-4, 10, 0) },
  { id: 'LAB-8005', patientId: 'PT-1033', doctorId: 'DR-108', testName: 'HbA1c', orderedDate: D(-5), sampleType: 'Blood', priority: 'routine', status: 'completed', result: '8.2', unit: '%', referenceRange: '4.0 – 5.6', notes: 'Poor glycaemic control; consider intensifying therapy.', abnormal: true, collectedAt: DT(-5, 8, 15), completedAt: DT(-4, 15, 40) },
  { id: 'LAB-8006', patientId: 'PT-1007', doctorId: 'DR-101', testName: 'Urea & Electrolytes', orderedDate: D(-6), sampleType: 'Blood', priority: 'routine', status: 'completed', result: 'Urea 6.8 mmol/L; K+ 4.2 mmol/L; Na+ 138 mmol/L', unit: '', referenceRange: 'Urea 2.5–7.1; K+ 3.5–5.0; Na+ 135–145', notes: 'Within normal limits.', abnormal: false, collectedAt: DT(-6, 9, 10), completedAt: DT(-6, 13, 30) },
  { id: 'LAB-8007', patientId: 'PT-1012', doctorId: 'DR-107', testName: 'Urinalysis', orderedDate: D(-7), sampleType: 'Urine', priority: 'routine', status: 'completed', result: 'Glucose: negative; Protein: trace; Nitrites: negative', unit: '', referenceRange: 'All parameters negative', notes: 'Trace protein in pregnancy – monitor at next visit.', abnormal: false, collectedAt: DT(-7, 9, 30), completedAt: DT(-7, 11, 15) },
  { id: 'LAB-8008', patientId: 'PT-1016', doctorId: 'DR-108', testName: 'Thyroid Function Test (TSH, FT4)', orderedDate: D(-8), sampleType: 'Blood', priority: 'routine', status: 'completed', result: 'TSH 5.8 mIU/L; FT4 10.2 pmol/L', unit: '', referenceRange: 'TSH 0.4–4.0; FT4 12–22', notes: 'Subclinical hypothyroidism; repeat in 3 months.', abnormal: true, collectedAt: DT(-8, 8, 50), completedAt: DT(-7, 16, 10) },
  { id: 'LAB-8009', patientId: 'PT-1023', doctorId: 'DR-103', testName: 'Lipid Profile', orderedDate: D(-9), sampleType: 'Blood', priority: 'routine', status: 'completed', result: 'Total Chol 5.9; LDL 3.8; HDL 1.0; TG 1.9 mmol/L', unit: '', referenceRange: 'Total <5.2; LDL <3.4; HDL >1.0; TG <1.7', notes: 'Raised LDL – dietary counselling given; consider statin.', abnormal: true, collectedAt: DT(-9, 7, 55), completedAt: DT(-8, 14, 45) },
  { id: 'LAB-8010', patientId: 'PT-1014', doctorId: 'DR-102', testName: 'Haemoglobin Genotype (Hb Electrophoresis)', orderedDate: D(-10), sampleType: 'Blood', priority: 'routine', status: 'completed', result: 'AS', unit: '', referenceRange: 'AA', notes: 'Sickle cell trait confirmed. Genetic counselling arranged.', abnormal: true, collectedAt: DT(-10, 9, 0), completedAt: DT(-9, 12, 30) },
  { id: 'LAB-8011', patientId: 'PT-1004', doctorId: 'DR-104', testName: 'Sputum AFB (Acid-Fast Bacilli)', orderedDate: D(-1), sampleType: 'Sputum', priority: 'urgent', status: 'processing', collectedAt: DT(-1, 10, 20) },
  { id: 'LAB-8012', patientId: 'PT-1025', doctorId: 'DR-108', testName: 'Fasting Blood Sugar', orderedDate: D(-1), sampleType: 'Blood', priority: 'routine', status: 'processing', collectedAt: DT(-1, 8, 5) },
  { id: 'LAB-8013', patientId: 'PT-1013', doctorId: 'DR-103', testName: 'Troponin I', orderedDate: D(0), sampleType: 'Blood', priority: 'stat', status: 'processing', collectedAt: DT(0, 9, 25) },
  { id: 'LAB-8014', patientId: 'PT-1026', doctorId: 'DR-104', testName: 'Full Blood Count', orderedDate: D(0), sampleType: 'Blood', priority: 'routine', status: 'processing', collectedAt: DT(0, 9, 50) },
  { id: 'LAB-8015', patientId: 'PT-1032', doctorId: 'DR-104', testName: 'Serum IgE', orderedDate: D(0), sampleType: 'Blood', priority: 'routine', status: 'processing' },
  { id: 'LAB-8016', patientId: 'PT-1029', doctorId: 'DR-103', testName: 'Renal Function Test', orderedDate: D(-1), sampleType: 'Blood', priority: 'urgent', status: 'collected', collectedAt: DT(-1, 15, 40) },
  { id: 'LAB-8017', patientId: 'PT-1030', doctorId: 'DR-109', testName: 'Widal Test', orderedDate: D(0), sampleType: 'Blood', priority: 'routine', status: 'collected', collectedAt: DT(0, 8, 45) },
  { id: 'LAB-8018', patientId: 'PT-1022', doctorId: 'DR-108', testName: 'HbA1c', orderedDate: D(0), sampleType: 'Blood', priority: 'routine', status: 'collected', collectedAt: DT(0, 10, 10) },
  { id: 'LAB-8019', patientId: 'PT-1020', doctorId: 'DR-107', testName: 'Rhesus Blood Group & Antibody Screen', orderedDate: D(0), sampleType: 'Blood', priority: 'urgent', status: 'collected', collectedAt: DT(0, 10, 35) },
  { id: 'LAB-8020', patientId: 'PT-1015', doctorId: 'DR-106', testName: 'Urine MCS (Culture & Sensitivity)', orderedDate: D(0), sampleType: 'Urine', priority: 'routine', status: 'requested' },
  { id: 'LAB-8021', patientId: 'PT-1028', doctorId: 'DR-104', testName: 'Serum Ferritin', orderedDate: D(0), sampleType: 'Blood', priority: 'routine', status: 'requested' },
  { id: 'LAB-8022', patientId: 'PT-1006', doctorId: 'DR-102', testName: 'Malaria Rapid Test (RDT)', orderedDate: D(0), sampleType: 'Blood', priority: 'urgent', status: 'requested' },
  { id: 'LAB-8023', patientId: 'PT-1036', doctorId: 'DR-107', testName: 'HBsAg (Hepatitis B Surface Antigen)', orderedDate: D(0), sampleType: 'Blood', priority: 'routine', status: 'requested' },
  { id: 'LAB-8024', patientId: 'PT-1017', doctorId: 'DR-106', testName: 'Wound Swab MCS', orderedDate: D(0), sampleType: 'Swab', priority: 'urgent', status: 'requested' },
];

const MOCK_MEDICAL_RECORDS = [
  { id: 'REC-9001', patientId: 'PT-1021', doctorId: 'DR-101', date: DT(0, 8, 20), type: 'vitals', title: 'Routine vital signs', description: 'Vitals taken at the start of the hypertension review consultation.', vitals: { bloodPressure: '148/92', heartRate: 82, temperature: 36.7, respiratoryRate: 16, oxygenSaturation: 98, weight: 84, height: 172 }, notes: 'BP remains above target. Reinforced low-salt diet and adherence to medication.' },
  { id: 'REC-9002', patientId: 'PT-1021', doctorId: 'DR-101', date: DT(-7, 10, 15), type: 'diagnosis', title: 'Hypertension – stage 2', description: 'Sustained raised blood pressure on repeated measurements at home and clinic.', diagnosis: 'Essential hypertension (stage 2), uncomplicated', symptoms: ['Occasional headaches', 'No chest pain', 'No palpitations'], treatmentPlan: 'Continue amlodipine 5mg and losartan 50mg daily; add low-salt diet; review in 4 weeks.', notes: 'Home BP diary requested. Urinalysis normal — no proteinuria.' },
  { id: 'REC-9003', patientId: 'PT-1003', doctorId: 'DR-108', date: DT(-3, 9, 40), type: 'note', title: 'Diabetes clinic review', description: 'Routine quarterly review at the diabetes clinic.', notes: 'HbA1c 8.2% – above target. Reinforced dietary advice and daily walking. Repeat HbA1c in 3 months.' },
  { id: 'REC-9004', patientId: 'PT-1003', doctorId: 'DR-108', date: DT(-10, 8, 5), type: 'diagnosis', title: 'Type 2 diabetes mellitus', description: 'New diagnosis of type 2 diabetes following raised fasting glucose.', diagnosis: 'Type 2 diabetes mellitus', symptoms: ['Increased thirst', 'Frequent urination', 'Fatigue'], treatmentPlan: 'Metformin 500mg twice daily with meals. Dietary counselling. HbA1c in 3 months.' },
  { id: 'REC-9005', patientId: 'PT-1019', doctorId: 'DR-109', date: DT(-2, 11, 10), type: 'diagnosis', title: 'Uncomplicated malaria', description: 'School-age child presenting with fever, chills and body aches.', diagnosis: 'Malaria (uncomplicated) – P. falciparum', symptoms: ['Fever 39.2°C', 'Chills', 'Body aches', 'Headache'], treatmentPlan: 'Artemether/lumefantrine full course with paracetamol as needed. Review in 72 hours if fever persists.' },
  { id: 'REC-9006', patientId: 'PT-1004', doctorId: 'DR-104', date: DT(-2, 9, 0), type: 'diagnosis', title: 'Acute asthma exacerbation', description: 'Wheezing and shortness of breath for two days, worse at night.', diagnosis: 'Acute asthma exacerbation (moderate)', symptoms: ['Wheeze', 'Shortness of breath', 'Chest tightness', 'Nocturnal cough'], treatmentPlan: 'Salbutamol inhaler 2 puffs 6-hourly, prednisolone 20mg daily for 5 days. Review in 5 days.', vitals: { bloodPressure: '118/76', heartRate: 98, temperature: 37.1, respiratoryRate: 22, oxygenSaturation: 94, weight: 68, height: 165 } },
  { id: 'REC-9007', patientId: 'PT-1035', doctorId: 'DR-105', date: DT(-3, 12, 30), type: 'diagnosis', title: 'Presumptive typhoid fever', description: 'Presented to the emergency unit with one week of fever, abdominal discomfort and diarrhoea.', diagnosis: 'Enteric fever (presumptive)', symptoms: ['Continuous fever', 'Abdominal pain', 'Loose stools', 'Malaise'], treatmentPlan: 'Ciprofloxacin 500mg twice daily for 10 days. Widal test and blood culture sent. Hydration with ORS.' },
  { id: 'REC-9008', patientId: 'PT-1023', doctorId: 'DR-103', date: DT(-1, 10, 45), type: 'diagnosis', title: 'Newly diagnosed hypertension', description: 'Clinic BP 152/96 on two separate visits; no end-organ damage on examination.', diagnosis: 'Essential hypertension (stage 1)', symptoms: ['Occasional dizziness', 'Nil chest pain'], treatmentPlan: 'Lifestyle modification and losartan 50mg nightly. Lipid profile and ECG requested.' },
  { id: 'REC-9009', patientId: 'PT-1027', doctorId: 'DR-108', date: DT(-3, 9, 30), type: 'note', title: 'Gastroscopy review', description: 'Patient reports significant improvement in epigastric pain since starting omeprazole.', notes: 'Continue omeprazole for 28-day course. Advised to avoid NSAIDs and reduce spicy food intake.' },
  { id: 'REC-9010', patientId: 'PT-1015', doctorId: 'DR-106', date: DT(-5, 14, 0), type: 'treatment', title: 'Physiotherapy plan – low back pain', description: 'Mechanical low back pain with no radicular symptoms. Physiotherapy initiated.', treatmentPlan: 'Twice-weekly physiotherapy for 4 weeks: core stabilisation, lumbar mobilisation and posture education. Ibuprofen 400mg TDS for 7 days.' },
  { id: 'REC-9011', patientId: 'PT-1012', doctorId: 'DR-107', date: DT(-6, 9, 20), type: 'vitals', title: 'Antenatal vitals – 28 weeks', description: 'Routine antenatal check. Fetal heart rate heard at 148 bpm.', vitals: { bloodPressure: '112/74', heartRate: 76, temperature: 36.9, respiratoryRate: 15, oxygenSaturation: 99, weight: 71, height: 160 }, notes: 'Fundal height 28 cm, appropriate for dates. Rhesus antibody screen requested.' },
  { id: 'REC-9012', patientId: 'PT-1029', doctorId: 'DR-103', date: DT(-2, 11, 0), type: 'note', title: 'CKD review', description: 'Stable renal function; eGFR 58 mL/min/1.73m². Continue antihypertensives.', notes: 'Avoid nephrotoxic drugs. Refer to renal dietician. Repeat U&Es in 3 months.' },
  { id: 'REC-9013', patientId: 'PT-1013', doctorId: 'DR-103', date: DT(-1, 15, 30), type: 'diagnosis', title: 'Hypertensive urgency', description: 'Admitted through emergency with BP 202/114 and headache. No neurological deficit.', diagnosis: 'Hypertensive urgency', symptoms: ['Headache', 'Blurred vision', 'No chest pain'], treatmentPlan: 'IV labetalol titration, telemetry monitoring, serial troponin. Oral regimen once controlled.', vitals: { bloodPressure: '178/102', heartRate: 96, temperature: 36.8, respiratoryRate: 18, oxygenSaturation: 97, weight: 88, height: 175 } },
  { id: 'REC-9014', patientId: 'PT-1007', doctorId: 'DR-101', date: DT(-6, 10, 40), type: 'note', title: 'Peptic ulcer follow-up', description: 'Epigastric pain largely resolved; occasional reflux after late meals.', notes: 'Continue omeprazole; consider H. pylori test if symptoms recur. Advised smaller, frequent meals.' },
  { id: 'REC-9015', patientId: 'PT-1028', doctorId: 'DR-104', date: DT(-4, 9, 15), type: 'diagnosis', title: 'Migraine without aura', description: 'Recurrent moderate-to-severe unilateral headaches with nausea, 2–3 per month.', diagnosis: 'Migraine without aura', symptoms: ['Unilateral throbbing headache', 'Nausea', 'Photophobia', 'Aura absent'], treatmentPlan: 'Start propranolol 40mg twice daily as prophylaxis. Keep headache diary. Acute attacks: ibuprofen early.' },
  { id: 'REC-9016', patientId: 'PT-1014', doctorId: 'DR-102', date: DT(-4, 10, 30), type: 'history', title: 'Family history – sickle cell disease', description: 'Maternal uncle has sickle cell disease. Patient tested AS (carrier).', notes: 'Genetic counselling completed with family. No treatment required; carrier status documented.' },
  { id: 'REC-9017', patientId: 'PT-1031', doctorId: 'DR-101', date: DT(-8, 12, 10), type: 'note', title: 'Discharge summary – pneumonia', description: 'Completed 7 days of amoxicillin for community-acquired pneumonia. Now afebrile and improving.', notes: 'Discharged home. Follow-up chest X-ray in 6 weeks at the review clinic.' },
  { id: 'REC-9018', patientId: 'PT-1016', doctorId: 'DR-108', date: DT(-8, 9, 0), type: 'note', title: 'Thyroid function follow-up', description: 'TSH 5.8 mIU/L – subclinical hypothyroidism. Discussed treatment options.', notes: 'Shared decision: observe and repeat thyroid function in 3 months.' },
  { id: 'REC-9019', patientId: 'PT-1025', doctorId: 'DR-108', date: DT(-9, 9, 50), type: 'vitals', title: 'Admission vitals', description: 'Admitted for stabilisation of blood sugar and blood pressure.', vitals: { bloodPressure: '156/94', heartRate: 88, temperature: 36.9, respiratoryRate: 17, oxygenSaturation: 97, weight: 92, height: 176 }, notes: 'Capillary glucose 11.4 mmol/L. Sliding-scale insulin while inpatients.' },
  { id: 'REC-9020', patientId: 'PT-1026', doctorId: 'DR-104', date: DT(-5, 9, 30), type: 'diagnosis', title: 'Persistent asthma', description: 'Frequent reliever use (>2 times weekly); night symptoms twice weekly.', diagnosis: 'Persistent asthma (moderate)', symptoms: ['Daily wheeze', 'Nocturnal cough', 'Exercise-induced symptoms'], treatmentPlan: 'Add inhaled corticosteroid if available; short prednisolone course for current flare. Review in 2 weeks.' },
  { id: 'REC-9021', patientId: 'PT-1022', doctorId: 'DR-108', date: DT(-4, 9, 10), type: 'note', title: 'Diabetes review', description: 'Fasting glucose improving on glibenclamide and metformin; mild morning hypoglycaemia twice.', notes: 'Advised to take glibenclamide strictly 30 minutes before meals. Monitor morning sugars.' },
  { id: 'REC-9022', patientId: 'PT-1009', doctorId: 'DR-108', date: DT(-10, 9, 45), type: 'diagnosis', title: 'Gastroesophageal reflux disease', description: 'Heartburn and acid regurgitation most days for two months.', diagnosis: 'GERD', symptoms: ['Heartburn', 'Acid regurgitation', 'Post-prandial bloating'], treatmentPlan: 'Omeprazole 20mg before breakfast for 14 days, lifestyle measures, review after course.' },
  { id: 'REC-9023', patientId: 'PT-1030', doctorId: 'DR-109', date: DT(-11, 9, 0), type: 'diagnosis', title: 'Viral upper respiratory tract infection', description: 'Runny nose, sore throat and low-grade fever for 3 days.', diagnosis: 'Viral URTI', symptoms: ['Rhinorrhoea', 'Sore throat', 'Cough', 'Fever 37.8°C'], treatmentPlan: 'Supportive care: fluids, paracetamol, cetirizine at night. School rest for 48 hours.' },
  { id: 'REC-9024', patientId: 'PT-1020', doctorId: 'DR-107', date: DT(-6, 10, 0), type: 'vitals', title: 'Antenatal booking vitals – 14 weeks', description: 'Booking visit. All baseline tests sent including blood group and HBsAg.', vitals: { bloodPressure: '108/70', heartRate: 74, temperature: 36.6, respiratoryRate: 15, oxygenSaturation: 99, weight: 58, height: 158 }, notes: 'Iron and folic acid supplementation started.' },
  { id: 'REC-9025', patientId: 'PT-1017', doctorId: 'DR-106', date: DT(-14, 11, 30), type: 'note', title: 'Pre-operative assessment – hernia repair', description: 'Fit for surgery under general anaesthesia. FBC, U&E and clotting screen requested.', notes: 'Nil significant on cardiovascular examination. Consent obtained.' },
  { id: 'REC-9026', patientId: 'PT-1011', doctorId: 'DR-105', date: DT(-6, 16, 20), type: 'treatment', title: 'Wound care – infected laceration', description: 'Right forearm laceration from a fall. Wound cleaned, edges viable; dressing applied.', treatmentPlan: 'Amoxicillin 500mg TDS for 7 days. Dressing change in 48 hours at the emergency review clinic.' },
  { id: 'REC-9027', patientId: 'PT-1036', doctorId: 'DR-107', date: DT(-7, 10, 15), type: 'diagnosis', title: 'First antenatal visit – 12 weeks', description: 'Confirmed intrauterine pregnancy by ultrasound; estimated gestational age 12 weeks.', diagnosis: 'Pregnancy – 12 weeks gestation', symptoms: ['Nausea in early pregnancy', 'Nil bleeding'], treatmentPlan: 'Booking bloods, folic acid 5mg daily, tetanus toxoid vaccination, scheduled monthly antenatal visits.' },
  { id: 'REC-9028', patientId: 'PT-1005', doctorId: 'DR-101', date: DT(-4, 13, 20), type: 'note', title: 'Osteoarthritis review', description: 'Knee pain stable on current plan; using walking stick on longer walks.', notes: 'Continue physiotherapy. Consider X-ray of both knees at next review if pain worsens.' },
  { id: 'REC-9029', patientId: 'PT-1018', doctorId: 'DR-107', date: DT(-6, 9, 5), type: 'note', title: 'Postnatal check – day 10', description: 'Normal vaginal delivery 10 days ago. Wound healing well; lochia settling.', notes: 'Breastfeeding established. Family planning counselling offered at 6-week visit.' },
  { id: 'REC-9030', patientId: 'PT-1032', doctorId: 'DR-104', date: DT(-10, 10, 0), type: 'diagnosis', title: 'Mild persistent asthma', description: 'Exercise-induced wheeze; well controlled between episodes.', diagnosis: 'Mild persistent asthma', symptoms: ['Exercise-induced wheeze', 'Occasional night cough'], treatmentPlan: 'Salbutamol before exercise; review with peak flow diary in 6 weeks. Serum IgE requested.' },
];

const pay = (offset: number, amount: number, method: string, ref: string) => ({ id: `PAY-${ref}`, date: D(offset), amount, method, reference: ref });

const MOCK_INVOICES = [
  { id: 'INV-10421', patientId: 'PT-1021', date: D(0), dueDate: D(7), items: [{ description: 'General Consultation', quantity: 1, unitPrice: 150 }, { description: 'Laboratory – Full Blood Count', quantity: 1, unitPrice: 120 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 95 }], subtotal: 365, discount: 0, insuranceCoverage: 109.5, total: 255.5, status: 'paid', payments: [pay(0, 255.5, 'Mobile Money', '10421-01')], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10422', patientId: 'PT-1023', date: D(0), dueDate: D(7), items: [{ description: 'Specialist Consultation', quantity: 1, unitPrice: 250 }, { description: 'ECG', quantity: 1, unitPrice: 90 }, { description: 'Laboratory – Lipid Profile', quantity: 1, unitPrice: 160 }], subtotal: 500, discount: 0, insuranceCoverage: 0, total: 500, status: 'pending', payments: [], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10423', patientId: 'PT-1019', date: D(-1), dueDate: D(6), items: [{ description: 'General Consultation', quantity: 1, unitPrice: 150 }, { description: 'Laboratory – Malaria Test', quantity: 1, unitPrice: 80 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 78 }], subtotal: 308, discount: 10, insuranceCoverage: 89.4, total: 208.6, status: 'paid', payments: [pay(-1, 208.6, 'Cash', '10423-01')], issuedBy: 'Abena Boakye' },
  { id: 'INV-10424', patientId: 'PT-1004', date: D(-2), dueDate: D(5), items: [{ description: 'Specialist Consultation', quantity: 1, unitPrice: 250 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 132 }, { description: 'Laboratory – Sputum AFB', quantity: 1, unitPrice: 140 }], subtotal: 522, discount: 0, insuranceCoverage: 261, total: 261, status: 'partial', payments: [pay(-1, 150, 'Mobile Money', '10424-01')], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10425', patientId: 'PT-1035', date: D(-3), dueDate: D(4), items: [{ description: 'Emergency Consultation', quantity: 1, unitPrice: 300 }, { description: 'Laboratory – Malaria Test', quantity: 1, unitPrice: 80 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 120 }, { description: 'Ambulance Service', quantity: 1, unitPrice: 300 }], subtotal: 800, discount: 0, insuranceCoverage: 0, total: 800, status: 'overdue', payments: [], issuedBy: 'Abena Boakye' },
  { id: 'INV-10426', patientId: 'PT-1003', date: D(-4), dueDate: D(3), items: [{ description: 'Specialist Consultation', quantity: 1, unitPrice: 250 }, { description: 'Laboratory – Blood Sugar (Fasting)', quantity: 1, unitPrice: 60 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 210 }], subtotal: 520, discount: 0, insuranceCoverage: 156, total: 364, status: 'paid', payments: [pay(-3, 364, 'Card', '10426-01')], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10427', patientId: 'PT-1013', date: D(-1), dueDate: D(13), items: [{ description: 'Admission (per day)', quantity: 2, unitPrice: 400 }, { description: 'Ward Nursing Care (per day)', quantity: 2, unitPrice: 200 }, { description: 'Specialist Consultation', quantity: 2, unitPrice: 250 }, { description: 'Laboratory – Troponin I', quantity: 1, unitPrice: 180 }, { description: 'ECG', quantity: 1, unitPrice: 90 }], subtotal: 1970, discount: 0, insuranceCoverage: 591, total: 1379, status: 'pending', payments: [], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10428', patientId: 'PT-1020', date: D(-6), dueDate: D(1), items: [{ description: 'Maternity Consultation', quantity: 1, unitPrice: 200 }, { description: 'Ultrasound Scan', quantity: 1, unitPrice: 250 }, { description: 'Laboratory – Urinalysis', quantity: 1, unitPrice: 50 }], subtotal: 500, discount: 0, insuranceCoverage: 250, total: 250, status: 'paid', payments: [pay(-5, 250, 'Insurance', '10428-01')], issuedBy: 'Abena Boakye' },
  { id: 'INV-10429', patientId: 'PT-1015', date: D(-5), dueDate: D(2), items: [{ description: 'General Consultation', quantity: 1, unitPrice: 150 }, { description: 'Physiotherapy Session', quantity: 2, unitPrice: 120 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 60 }], subtotal: 450, discount: 0, insuranceCoverage: 135, total: 315, status: 'partial', payments: [pay(-4, 200, 'Cash', '10429-01')], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10430', patientId: 'PT-1012', date: D(-7), dueDate: D(0), items: [{ description: 'Maternity Consultation', quantity: 1, unitPrice: 200 }, { description: 'Laboratory – Urinalysis', quantity: 1, unitPrice: 50 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 85 }], subtotal: 335, discount: 0, insuranceCoverage: 167.5, total: 167.5, status: 'paid', payments: [pay(-6, 167.5, 'Mobile Money', '10430-01')], issuedBy: 'Abena Boakye' },
  { id: 'INV-10431', patientId: 'PT-1025', date: D(-1), dueDate: D(13), items: [{ description: 'Admission (per day)', quantity: 1, unitPrice: 400 }, { description: 'Ward Nursing Care (per day)', quantity: 1, unitPrice: 200 }, { description: 'Specialist Consultation', quantity: 1, unitPrice: 250 }, { description: 'Laboratory – Blood Sugar (Fasting)', quantity: 1, unitPrice: 60 }], subtotal: 910, discount: 0, insuranceCoverage: 273, total: 637, status: 'pending', payments: [], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10432', patientId: 'PT-1022', date: D(-4), dueDate: D(3), items: [{ description: 'Specialist Consultation', quantity: 1, unitPrice: 250 }, { description: 'Laboratory – HbA1c', quantity: 1, unitPrice: 120 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 180 }], subtotal: 550, discount: 0, insuranceCoverage: 165, total: 385, status: 'paid', payments: [pay(-3, 385, 'Cash', '10432-01')], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10433', patientId: 'PT-1016', date: D(-8), dueDate: D(-1), items: [{ description: 'General Consultation', quantity: 1, unitPrice: 150 }, { description: 'Laboratory – Thyroid Function Test', quantity: 1, unitPrice: 220 }], subtotal: 370, discount: 0, insuranceCoverage: 185, total: 185, status: 'overdue', payments: [], issuedBy: 'Abena Boakye' },
  { id: 'INV-10434', patientId: 'PT-1027', date: D(-10), dueDate: D(-3), items: [{ description: 'General Consultation', quantity: 1, unitPrice: 150 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 45 }], subtotal: 195, discount: 0, insuranceCoverage: 0, total: 195, status: 'paid', payments: [pay(-9, 195, 'Mobile Money', '10434-01')], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10435', patientId: 'PT-1033', date: D(-8), dueDate: D(-1), items: [{ description: 'Specialist Consultation', quantity: 1, unitPrice: 250 }, { description: 'Laboratory – HbA1c', quantity: 1, unitPrice: 120 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 190 }], subtotal: 560, discount: 0, insuranceCoverage: 168, total: 392, status: 'overdue', payments: [], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10436', patientId: 'PT-1011', date: D(-6), dueDate: D(1), items: [{ description: 'Emergency Consultation', quantity: 1, unitPrice: 300 }, { description: 'Minor Surgery (wound care)', quantity: 1, unitPrice: 200 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 95 }], subtotal: 595, discount: 0, insuranceCoverage: 0, total: 595, status: 'paid', payments: [pay(-5, 595, 'Cash', '10436-01')], issuedBy: 'Abena Boakye' },
  { id: 'INV-10437', patientId: 'PT-1028', date: D(-4), dueDate: D(3), items: [{ description: 'Specialist Consultation', quantity: 1, unitPrice: 250 }, { description: 'Laboratory – Serum Ferritin', quantity: 1, unitPrice: 90 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 120 }], subtotal: 460, discount: 20, insuranceCoverage: 132, total: 308, status: 'paid', payments: [pay(-3, 308, 'Card', '10437-01')], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10438', patientId: 'PT-1026', date: D(-5), dueDate: D(2), items: [{ description: 'Specialist Consultation', quantity: 1, unitPrice: 250 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 145 }], subtotal: 395, discount: 0, insuranceCoverage: 118.5, total: 276.5, status: 'paid', payments: [pay(-4, 276.5, 'Insurance', '10438-01')], issuedBy: 'Abena Boakye' },
  { id: 'INV-10439', patientId: 'PT-1029', date: D(-2), dueDate: D(5), items: [{ description: 'Specialist Consultation', quantity: 1, unitPrice: 250 }, { description: 'Laboratory – Renal Function Test', quantity: 1, unitPrice: 110 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 170 }], subtotal: 530, discount: 0, insuranceCoverage: 265, total: 265, status: 'pending', payments: [], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10440', patientId: 'PT-1030', date: D(-11), dueDate: D(-4), items: [{ description: 'General Consultation', quantity: 1, unitPrice: 150 }, { description: 'Laboratory – Widal Test', quantity: 1, unitPrice: 70 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 55 }], subtotal: 275, discount: 0, insuranceCoverage: 82.5, total: 192.5, status: 'paid', payments: [pay(-10, 192.5, 'Mobile Money', '10440-01')], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10441', patientId: 'PT-1007', date: D(-6), dueDate: D(1), items: [{ description: 'General Consultation', quantity: 1, unitPrice: 150 }, { description: 'Laboratory – Urea & Electrolytes', quantity: 1, unitPrice: 90 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 130 }], subtotal: 370, discount: 0, insuranceCoverage: 185, total: 185, status: 'paid', payments: [pay(-5, 185, 'Cash', '10441-01')], issuedBy: 'Abena Boakye' },
  { id: 'INV-10442', patientId: 'PT-1031', date: D(-9), dueDate: D(-2), items: [{ description: 'Admission (per day)', quantity: 3, unitPrice: 400 }, { description: 'Ward Nursing Care (per day)', quantity: 3, unitPrice: 200 }, { description: 'X-Ray (Chest)', quantity: 1, unitPrice: 180 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 240 }], subtotal: 2220, discount: 0, insuranceCoverage: 1110, total: 1110, status: 'overdue', payments: [], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10443', patientId: 'PT-1001', date: D(-2), dueDate: D(5), items: [{ description: 'Specialist Consultation', quantity: 1, unitPrice: 250 }, { description: 'Laboratory – Lipid Profile', quantity: 1, unitPrice: 160 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 85 }], subtotal: 495, discount: 0, insuranceCoverage: 247.5, total: 247.5, status: 'paid', payments: [pay(-1, 247.5, 'Mobile Money', '10443-01')], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10444', patientId: 'PT-1018', date: D(-6), dueDate: D(1), items: [{ description: 'Delivery (Normal)', quantity: 1, unitPrice: 1500 }, { description: 'Ward Nursing Care (per day)', quantity: 2, unitPrice: 200 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 120 }], subtotal: 2020, discount: 0, insuranceCoverage: 1010, total: 1010, status: 'paid', payments: [pay(-4, 1010, 'Bank Transfer', '10444-01')], issuedBy: 'Abena Boakye' },
  { id: 'INV-10445', patientId: 'PT-1005', date: D(-4), dueDate: D(3), items: [{ description: 'General Consultation', quantity: 1, unitPrice: 150 }, { description: 'Physiotherapy Session', quantity: 1, unitPrice: 120 }, { description: 'Pharmacy – Dispensed Medication', quantity: 1, unitPrice: 70 }], subtotal: 340, discount: 0, insuranceCoverage: 170, total: 170, status: 'paid', payments: [pay(-3, 170, 'Cash', '10445-01')], issuedBy: 'Akua Tetteh' },
  { id: 'INV-10446', patientId: 'PT-1034', date: D(-3), dueDate: D(4), items: [{ description: 'Specialist Consultation', quantity: 1, unitPrice: 250 }, { description: 'ECG', quantity: 1, unitPrice: 90 }], subtotal: 340, discount: 0, insuranceCoverage: 102, total: 238, status: 'pending', payments: [], issuedBy: 'Akua Tetteh' },
];

const MOCK_STAFF = [
  { id: 'STF-401', name: 'Nana Adwoa Owusu', role: 'Administrator', department: 'Administration', phone: '+233 24 100 2201', email: 'nana.owusu@adommedicalcentre.gh', status: 'active', joinedDate: '2012-01-09' },
  { id: 'STF-402', name: 'Akua Tetteh', role: 'Receptionist', department: 'Front Desk', phone: '+233 24 100 2204', email: 'akua.tetteh@adommedicalcentre.gh', status: 'active', joinedDate: '2019-06-17' },
  { id: 'STF-403', name: 'Yaw Osei', role: 'Pharmacist', department: 'Pharmacy', phone: '+233 24 100 2205', email: 'yaw.osei@adommedicalcentre.gh', status: 'active', joinedDate: '2015-09-01' },
  { id: 'STF-404', name: 'Ama Agyeman', role: 'Laboratory Technician', department: 'Laboratory', phone: '+233 24 100 2206', email: 'ama.agyeman@adommedicalcentre.gh', status: 'active', joinedDate: '2017-03-27' },
  { id: 'STF-405', name: 'Kwabena Frimpong', role: 'Accountant', department: 'Finance', phone: '+233 24 100 2207', email: 'kwabena.frimpong@adommedicalcentre.gh', status: 'active', joinedDate: '2018-11-12' },
  { id: 'STF-406', name: 'Abena Boakye', role: 'Receptionist', department: 'Front Desk', phone: '+233 20 331 4567', email: 'abena.boakye@adommedicalcentre.gh', status: 'active', joinedDate: '2021-02-08' },
  { id: 'STF-407', name: 'Emmanuel Cudjoe', role: 'Laboratory Technician', department: 'Laboratory', phone: '+233 26 774 1209', email: 'emmanuel.cudjoe@adommedicalcentre.gh', status: 'active', joinedDate: '2020-07-20' },
  { id: 'STF-408', name: 'Adjoa Sarpong', role: 'Pharmacist', department: 'Pharmacy', phone: '+233 54 118 7763', email: 'adjoa.sarpong@adommedicalcentre.gh', status: 'active', joinedDate: '2022-04-04' },
  { id: 'STF-409', name: 'Kojo Appiah', role: 'Accountant', department: 'Finance', phone: '+233 20 992 3411', email: 'kojo.appiah@adommedicalcentre.gh', status: 'active', joinedDate: '2019-10-14' },
  { id: 'STF-410', name: 'Efua Quansah', role: 'HR Officer', department: 'Administration', phone: '+233 26 550 1287', email: 'efua.quansah@adommedicalcentre.gh', status: 'active', joinedDate: '2016-08-29' },
  { id: 'STF-411', name: 'Nii Adjei', role: 'IT Officer', department: 'Administration', phone: '+233 54 220 9876', email: 'nii.adjei@adommedicalcentre.gh', status: 'active', joinedDate: '2021-12-06' },
  { id: 'STF-412', name: 'Grace Mensah', role: 'Medical Records Officer', department: 'Administration', phone: '+233 27 445 6620', email: 'grace.mensah@adommedicalcentre.gh', status: 'inactive', joinedDate: '2018-05-21' },
];

const MOCK_NOTIFICATIONS = [
  { id: 'NTF-001', type: 'lab', title: 'Lab result available', message: 'Full Blood Count result for Kwame Osei-Bonsu (PT-1021) is ready for review.', time: T(0.5), read: false, link: '/laboratory/LAB-8001' },
  { id: 'NTF-002', type: 'appointment', title: 'New appointment scheduled', message: 'Akua Afriyie booked an antenatal check-up with Dr. Kwame Asante tomorrow at 10:00.', time: T(1), read: false, link: '/appointments' },
  { id: 'NTF-003', type: 'pharmacy', title: 'Low stock alert', message: 'Insulin Glargine 100IU/ml pen is below reorder level (38 remaining).', time: T(2.5), read: false, link: '/pharmacy/medicines' },
  { id: 'NTF-004', type: 'billing', title: 'Payment received', message: 'GH₵ 255.50 received from Kwame Osei-Bonsu for invoice INV-10421.', time: T(3), read: false, link: '/billing' },
  { id: 'NTF-005', type: 'patient', title: 'New patient registered', message: 'Ama Nyarko (PT-1036) was registered at the front desk today.', time: T(4), read: true, link: '/patients/PT-1036' },
  { id: 'NTF-006', type: 'appointment', title: 'Appointment completed', message: 'Hypertension review with Nana Osei Tutu was marked as completed.', time: T(5), read: true, link: '/appointments' },
  { id: 'NTF-007', type: 'pharmacy', title: 'Expired stock detected', message: 'Ferrous sulfate 200mg batch FS-1120 has expired and should be quarantined.', time: T(8), read: true, link: '/pharmacy/medicines' },
  { id: 'NTF-008', type: 'lab', title: 'STAT test processing', message: 'Troponin I for Kweku Appiah (PT-1013) is being processed urgently.', time: T(9), read: true, link: '/laboratory/LAB-8013' },
  { id: 'NTF-009', type: 'billing', title: 'Invoice overdue', message: 'Invoice INV-10425 (Fiifi Coleman) is now overdue by 3 days.', time: T(26), read: true, link: '/billing' },
  { id: 'NTF-010', type: 'system', title: 'System maintenance', message: 'Scheduled maintenance on the patient portal this Sunday, 02:00 – 04:00.', time: T(30), read: true },
];

const MOCK_WARDS = [
  { id: 'W-GEN', name: 'General Ward 1C', location: 'Ground Floor, Block A', departmentId: 'GEN' },
  { id: 'W-MAT', name: 'Maternity Ward 2A', location: 'First Floor, Block A', departmentId: 'MAT' },
  { id: 'W-POST', name: 'Postnatal Ward 2B', location: 'First Floor, Block A', departmentId: 'MAT' },
  { id: 'W-PED', name: 'Paediatric Ward 1B', location: 'First Floor, Block B', departmentId: 'PED' },
  { id: 'W-SUR', name: 'Surgical Ward 3B', location: 'Third Floor, Block A', departmentId: 'SUR' },
  { id: 'W-EMER', name: 'Emergency Bay', location: 'Ground Floor, Main Entrance', departmentId: 'EME' },
  { id: 'W-CAR', name: 'Cardiology Unit', location: 'Second Floor, Block A', departmentId: 'CAR' },
  { id: 'W-ICU', name: 'Intensive Care Unit', location: 'Second Floor, Block B', departmentId: 'SUR' },
  { id: 'W-NEU', name: 'Neurology Ward', location: 'Second Floor, Block B', departmentId: 'NEU' },
  { id: 'W-PRI', name: 'Private Wing', location: 'Fourth Floor, Block A', departmentId: 'GEN' },
];

const MOCK_BEDS = [
  { id: 'BD-001', number: 'G-101', wardId: 'W-GEN', type: 'General', status: 'occupied', ratePerDay: 220 },
  { id: 'BD-002', number: 'G-102', wardId: 'W-GEN', type: 'General', status: 'occupied', ratePerDay: 220 },
  { id: 'BD-003', number: 'G-103', wardId: 'W-GEN', type: 'General', status: 'available', ratePerDay: 220 },
  { id: 'BD-004', number: 'G-104', wardId: 'W-GEN', type: 'General', status: 'available', ratePerDay: 220 },
  { id: 'BD-005', number: 'G-105', wardId: 'W-GEN', type: 'General', status: 'maintenance', ratePerDay: 220 },
  { id: 'BD-006', number: 'M-201', wardId: 'W-MAT', type: 'Maternity', status: 'occupied', ratePerDay: 260 },
  { id: 'BD-007', number: 'M-202', wardId: 'W-MAT', type: 'Maternity', status: 'available', ratePerDay: 260 },
  { id: 'BD-008', number: 'M-203', wardId: 'W-MAT', type: 'Maternity', status: 'available', ratePerDay: 260 },
  { id: 'BD-009', number: 'M-204', wardId: 'W-POST', type: 'Maternity', status: 'occupied', ratePerDay: 240 },
  { id: 'BD-010', number: 'P-112', wardId: 'W-PED', type: 'Paediatric', status: 'available', ratePerDay: 200 },
  { id: 'BD-011', number: 'P-113', wardId: 'W-PED', type: 'Paediatric', status: 'occupied', ratePerDay: 200 },
  { id: 'BD-012', number: 'S-301', wardId: 'W-SUR', type: 'Surgical', status: 'occupied', ratePerDay: 280 },
  { id: 'BD-013', number: 'S-302', wardId: 'W-SUR', type: 'Surgical', status: 'available', ratePerDay: 280 },
  { id: 'BD-014', number: 'S-303', wardId: 'W-SUR', type: 'Surgical', status: 'maintenance', ratePerDay: 280 },
  { id: 'BD-015', number: 'E-01', wardId: 'W-EMER', type: 'Emergency', status: 'available', ratePerDay: 300 },
  { id: 'BD-016', number: 'E-02', wardId: 'W-EMER', type: 'Emergency', status: 'available', ratePerDay: 300 },
  { id: 'BD-017', number: 'C-401', wardId: 'W-CAR', type: 'General', status: 'occupied', ratePerDay: 320 },
  { id: 'BD-018', number: 'C-402', wardId: 'W-CAR', type: 'General', status: 'available', ratePerDay: 320 },
  { id: 'BD-019', number: 'ICU-1', wardId: 'W-ICU', type: 'ICU', status: 'occupied', ratePerDay: 600 },
  { id: 'BD-020', number: 'ICU-2', wardId: 'W-ICU', type: 'ICU', status: 'available', ratePerDay: 600 },
  { id: 'BD-021', number: 'N-501', wardId: 'W-NEU', type: 'General', status: 'available', ratePerDay: 240 },
  { id: 'BD-022', number: 'N-502', wardId: 'W-NEU', type: 'General', status: 'maintenance', ratePerDay: 240 },
  { id: 'BD-023', number: 'PR-601', wardId: 'W-PRI', type: 'Private', status: 'available', ratePerDay: 500 },
  { id: 'BD-024', number: 'PR-602', wardId: 'W-PRI', type: 'Private', status: 'available', ratePerDay: 500 },
];

const MOCK_BED_ASSIGNMENTS = [
  { id: 'BA-9001', bedId: 'BD-001', patientId: 'PT-1013', assignedAt: DT(-6, 14, 20), releasedAt: null, notes: 'Admitted for hypertension monitoring.' },
  { id: 'BA-9002', bedId: 'BD-002', patientId: 'PT-1025', assignedAt: DT(-3, 10, 5), releasedAt: null, notes: 'Post-observation, diabetic care.' },
  { id: 'BA-9003', bedId: 'BD-006', patientId: 'PT-1004', assignedAt: DT(-2, 18, 40), releasedAt: null },
  { id: 'BA-9004', bedId: 'BD-009', patientId: 'PT-1002', assignedAt: DT(-1, 9, 15), releasedAt: null, notes: 'Postnatal care.' },
  { id: 'BA-9005', bedId: 'BD-011', patientId: 'PT-1014', assignedAt: DT(-4, 16, 55), releasedAt: null },
  { id: 'BA-9006', bedId: 'BD-012', patientId: 'PT-1005', assignedAt: DT(-5, 11, 30), releasedAt: null, notes: 'Awaiting discharge review.' },
  { id: 'BA-9007', bedId: 'BD-017', patientId: 'PT-1001', assignedAt: DT(-2, 21, 10), releasedAt: null, notes: 'Chest pain observation.' },
  { id: 'BA-9008', bedId: 'BD-019', patientId: 'PT-1003', assignedAt: DT(0, 7, 45), releasedAt: null, notes: 'ICU — intensive monitoring.' },
  { id: 'BA-8080', bedId: 'BD-003', patientId: 'PT-1006', assignedAt: DT(-12, 8, 0), releasedAt: DT(-8, 16, 0), notes: 'Discharged in stable condition.' },
  { id: 'BA-8081', bedId: 'BD-007', patientId: 'PT-1007', assignedAt: DT(-9, 13, 20), releasedAt: DT(-6, 10, 35) },
  { id: 'BA-8082', bedId: 'BD-013', patientId: 'PT-1008', assignedAt: DT(-15, 9, 10), releasedAt: DT(-10, 12, 45), notes: 'Post-surgical recovery complete.' },
];

async function seed() {
  console.log('Seeding database...');
  try {
    console.log('Truncating all tables...');
    await pool.query('TRUNCATE users, departments, doctors, nurses, patients, appointments, medicines, prescriptions, lab_tests, medical_records, invoices, staff, notifications, wards, beds, bed_assignments CASCADE');

    console.log('Seeding users...');
    const hashedUsers = await Promise.all(
      MOCK_USERS.map(async (u) => ({ ...u, password: await hashPassword(u.password) }))
    );
    await db.insert(users).values(hashedUsers as (typeof users.$inferInsert)[]);

    console.log('Seeding departments...');
    await db.insert(departments).values(MOCK_DEPARTMENTS as (typeof departments.$inferInsert)[]);

    console.log('Seeding doctors...');
    await db.insert(doctors).values(MOCK_DOCTORS as (typeof doctors.$inferInsert)[]);

    console.log('Seeding nurses...');
    await db.insert(nurses).values(MOCK_NURSES as (typeof nurses.$inferInsert)[]);

    console.log('Seeding patients...');
    await db.insert(patients).values(MOCK_PATIENTS as (typeof patients.$inferInsert)[]);

    console.log('Seeding appointments...');
    await db.insert(appointments).values(MOCK_APPOINTMENTS as (typeof appointments.$inferInsert)[]);

    console.log('Seeding medicines...');
    await db.insert(medicines).values(MOCK_MEDICINES as (typeof medicines.$inferInsert)[]);

    console.log('Seeding prescriptions...');
    await db.insert(prescriptions).values(MOCK_PRESCRIPTIONS as (typeof prescriptions.$inferInsert)[]);

    console.log('Seeding lab tests...');
    await db.insert(labTests).values(MOCK_LAB_TESTS as (typeof labTests.$inferInsert)[]);

    console.log('Seeding medical records...');
    await db.insert(medicalRecords).values(MOCK_MEDICAL_RECORDS as (typeof medicalRecords.$inferInsert)[]);

    console.log('Seeding invoices...');
    await db.insert(invoices).values(MOCK_INVOICES as (typeof invoices.$inferInsert)[]);

    console.log('Seeding staff...');
    await db.insert(staff).values(MOCK_STAFF as (typeof staff.$inferInsert)[]);

    console.log('Seeding notifications...');
    await db.insert(notifications).values(MOCK_NOTIFICATIONS as (typeof notifications.$inferInsert)[]);

    console.log('Seeding wards...');
    await db.insert(wards).values(MOCK_WARDS);

    console.log('Seeding beds...');
    await db.insert(beds).values(MOCK_BEDS as (typeof beds.$inferInsert)[]);

    console.log('Seeding bed assignments...');
    await db.insert(bedAssignments).values(MOCK_BED_ASSIGNMENTS);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await pool.end();
  }
}

seed();
