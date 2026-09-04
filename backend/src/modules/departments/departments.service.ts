import { findAllDepartments, findDepartmentById, getDepartmentStaff } from './departments.repository';

export async function listDepartments() {
  return findAllDepartments();
}

export async function getDepartment(id: string) {
  return findDepartmentById(id);
}

export async function getDepartmentStaffList(id: string) {
  return getDepartmentStaff(id);
}
