import { Router, Request, Response } from 'express';
import whatsappGateway from '../gateways/whatsapp.gateway';
import prisma from '../config/db';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

const router = Router();

router.get('/whatsapp', asyncHandler(async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const verifiedToken = whatsappGateway.verifyWebhook(mode, token, challenge);

  if (verifiedToken !== null) {
    return res.status(200).send(verifiedToken);
  }

  return res.status(403).json(apiResponse.forbidden('Verification failed'));
}));

router.post('/whatsapp', asyncHandler(async (req: Request, res: Response) => {
  const { entry } = req.body;

  if (!entry || !entry[0]?.changes) {
    return res.status(200).json(apiResponse.success(null, 'Webhook received'));
  }

  for (const change of entry[0].changes) {
    const { value } = change;
    
    if (!value?.messages || !value.messages[0]) {
      continue;
    }

    const message = value.messages[0];
    const status = value.statuses?.[0];

    if (message) {
      await prisma.whatsAppWebhookEvent.create({
        data: {
          providerEventId: message.id,
          messageType: message.type,
          from: message.from,
          messageId: message.id,
          rawPayload: message as any,
        },
      });
    }

    if (status) {
      const existingEvent = await prisma.whatsAppWebhookEvent.findFirst({
        where: { messageId: status.id },
      });

      if (existingEvent) {
        await prisma.whatsAppWebhookEvent.update({
          where: { id: existingEvent.id },
          data: {
            status: status.status,
            errorCode: status.errors?.[0]?.code,
            errorMessage: status.errors?.[0]?.message,
          },
        });

        let sendStatus = null;
        if (status.status === 'sent') sendStatus = 'SENT';
        else if (status.status === 'delivered') sendStatus = 'DELIVERED';
        else if (status.status === 'read') sendStatus = 'READ';
        else if (status.status === 'failed') sendStatus = 'FAILED';

        if (sendStatus) {
          await prisma.notificationLog.updateMany({
            where: { providerMessageId: status.id },
            data: {
              sentStatus: sendStatus as any,
              ...(sendStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
              ...(sendStatus === 'READ' ? { readAt: new Date() } : {}),
            },
          });
        }
      }
    }
  }

  return res.status(200).json(apiResponse.success(null, 'Webhook processed'));
}));

export default router;
