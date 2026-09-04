import { patients } from '../../db/schema';
import type { PatientListQuery } from './patients.types';
import {
  findAllPatients,
  findPatientById,
  generatePatientId,
  createPatient,
  updatePatient,
} from './patients.repository';
import type { Patient } from '../../types';

export async function listPatients(query: PatientListQuery): Promise<Patient[]> {
  return findAllPatients(query);
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  return findPatientById(id);
}

const PATIENT_ALLOWED_KEYS = [
  'firstName', 'lastName', 'dateOfBirth', 'gender', 'phone', 'email',
  'address', 'city', 'nationality', 'bloodGroup', 'genotype', 'allergies',
  'conditions', 'emergencyContact', 'insurance', 'registrationDate',
  'assignedDoctorId', 'status', 'type',
];

export async function createPatientRecord(body: Partial<Patient>): Promise<Patient> {
  const id = await generatePatientId();

  const values: typeof patients.$inferInsert = {
    id,
    firstName: body.firstName!,
    lastName: body.lastName!,
    dateOfBirth: body.dateOfBirth!,
    gender: body.gender as 'Male' | 'Female',
    phone: body.phone!,
    email: body.email ?? '',
    address: body.address ?? '',
    city: body.city ?? '',
    nationality: body.nationality ?? '',
    bloodGroup: body.bloodGroup ?? 'O+',
    genotype: body.genotype ?? 'AA',
    allergies: body.allergies ?? [],
    conditions: body.conditions ?? [],
    emergencyContact: body.emergencyContact ?? { name: '', relationship: '', phone: '' },
    insurance: body.insurance ?? null,
    registrationDate: body.registrationDate ?? new Date().toISOString().slice(0, 10),
    assignedDoctorId: body.assignedDoctorId ?? null,
    status: (body.status as 'active' | 'inactive' | 'admitted' | 'discharged') ?? 'active',
    type: (body.type as 'new' | 'returning') ?? 'new',
  };

  return createPatient(values);
}

export async function updatePatientRecord(
  id: string,
  body: Partial<Patient>,
): Promise<{ patient: Patient | undefined; empty: boolean }> {
  const { id: _id, ...patchFields } = body;

  const updateData: Record<string, unknown> = {};
  for (const key of PATIENT_ALLOWED_KEYS) {
    if (key in patchFields) {
      updateData[key] = (patchFields as Record<string, unknown>)[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return { patient: undefined, empty: true };
  }

  const patient = await updatePatient(id, updateData);
  return { patient, empty: false };
}
