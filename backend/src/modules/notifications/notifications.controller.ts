import type { Request, Response } from 'express';
import { listNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './notifications.service';

export async function listHandler(_req: Request, res: Response) {
  const result = await listNotifications();
  res.json(result);
}

export async function readHandler(req: Request, res: Response) {
  const { notification, error } = await markNotificationAsRead(req.params.id);

  if (error) {
    res.status(404).json({ message: error });
    return;
  }
  res.json(notification);
}

export async function readAllHandler(_req: Request, res: Response) {
  await markAllNotificationsAsRead();
  res.status(204).end();
}
