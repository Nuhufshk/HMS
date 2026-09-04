import type { Doctor, DoctorAvailability, DoctorStatus } from '../../types';

export type DoctorCreateInput = Partial<Doctor>;
export type DoctorUpdateInput = Partial<Doctor>;

export interface DoctorListQuery {
  availability?: string;
  departmentId?: string;
}
