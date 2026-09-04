import type { Request, Response } from 'express';
import { listDepartments, getDepartment, getDepartmentStaffList } from './departments.service';

export async function listHandler(_req: Request, res: Response) {
  const result = await listDepartments();
  res.json(result);
}

export async function getHandler(req: Request, res: Response) {
  const department = await getDepartment(req.params.id);
  res.json(department);
}

export async function staffHandler(req: Request, res: Response) {
  const result = await getDepartmentStaffList(req.params.id);
  res.json(result);
}
