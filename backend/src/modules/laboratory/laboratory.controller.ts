import type { Request, Response } from 'express';
import {
  listLabTests,
  getLabTest,
  createLabTestRecord,
  updateLabTestStatus,
  submitLabResult,
} from './laboratory.service';

export async function listHandler(req: Request, res: Response) {
  const patientId = String(req.query.patientId ?? '') || undefined;
  const result = await listLabTests(patientId);
  res.json(result);
}

export async function getHandler(req: Request, res: Response) {
  const labTest = await getLabTest(req.params.id);
  if (!labTest) {
    res.status(404).json({ message: 'Lab test not found' });
    return;
  }
  res.json(labTest);
}

export async function createHandler(req: Request, res: Response) {
  const { labTest, error } = await createLabTestRecord(req.body ?? {});

  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  res.status(201).json(labTest);
}

export async function statusUpdateHandler(req: Request, res: Response) {
  const status = (req.body ?? {}).status;
  const { labTest, error } = await updateLabTestStatus(req.params.id, status);

  if (error) {
    const status_code = error.includes('not found') ? 404 : 400;
    res.status(status_code).json({ message: error });
    return;
  }
  res.json(labTest);
}

export async function resultHandler(req: Request, res: Response) {
  const { labTest, error } = await submitLabResult(req.params.id, req.body ?? {});

  if (error) {
    const status_code = error.includes('not found') ? 404 : 400;
    res.status(status_code).json({ message: error });
    return;
  }
  res.json(labTest);
}
