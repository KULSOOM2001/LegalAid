import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { Case } from '../cases/entities/case.entity';
import { Document } from '../documents/entities/document.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Injectable()
@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || '*' } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private jwtService: JwtService,
    @InjectRepository(Notification) private notificationsRepo: Repository<Notification>,
  ) {}

  handleConnection(client: Socket) {
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { token: string }) {
    try {
      const payload: any = this.jwtService.verify(data.token, {
        secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
      });
      client.join(`user:${payload.sub}`);
      client.join(`role:${payload.role}`);
      client.emit('joined', { userId: payload.sub, role: payload.role });
    } catch {
      client.emit('error', { message: 'Invalid token' });
    }
  }

  private async push(userId: string, type: string, message: string, meta: Record<string, any> = {}) {
    const notif = this.notificationsRepo.create({ userId, type, message, meta });
    await this.notificationsRepo.save(notif);
    this.server.to(`user:${userId}`).emit('notification:new', notif);
    return notif;
  }

  async notifyCaseStatusChanged(c: Case) {
    if (c.citizenId) await this.push(c.citizenId, 'case:status_changed', `Your case "${c.title}" is now ${c.status}`, { caseId: c.id, status: c.status });
    if (c.volunteerId) await this.push(c.volunteerId, 'case:status_changed', `Case "${c.title}" is now ${c.status}`, { caseId: c.id, status: c.status });
  }

  async notifyCaseAssigned(c: Case) {
    if (c.volunteerId) await this.push(c.volunteerId, 'case:assigned', `You have been assigned case "${c.title}"`, { caseId: c.id });
  }

  async notifyDocumentUploaded(doc: Document, caseTitle: string) {
    if (doc['case']?.volunteerId) {
      await this.push(doc['case'].volunteerId, 'document:uploaded', `New document uploaded for case "${caseTitle}"`, { caseId: doc.caseId, documentId: doc.id });
    }
  }

  async notifyAppointmentReminder(appt: Appointment, hoursBefore: 24 | 1) {
    const label = hoursBefore === 24 ? '24 hours' : '1 hour';
    await this.push(appt.citizenId, 'appointment:reminder', `Reminder: appointment in ${label}`, { appointmentId: appt.id });
    await this.push(appt.volunteerId, 'appointment:reminder', `Reminder: appointment in ${label}`, { appointmentId: appt.id });
  }

  async notifyGeneric(userId: string, message: string, meta: Record<string, any> = {}) {
    await this.push(userId, 'notification:new', message, meta);
  }

  async notifyAppointmentRequested(appt: Appointment) {
  await this.push(
    appt.volunteerId,
    'appointment:requested',
    `New appointment request for ${new Date(appt.startsAt).toLocaleString()}`,
    { appointmentId: appt.id },
  );
}

async notifyAppointmentStatusChanged(appt: Appointment) {
  const label =
    appt.status === 'confirmed' ? 'confirmed' :
    appt.status === 'cancelled' ? 'cancelled' :
    appt.status === 'rescheduled' ? 'rescheduled' : appt.status;
  await this.push(
    appt.citizenId,
    'appointment:status_changed',
    `Your appointment was ${label} by the volunteer`,
    { appointmentId: appt.id, status: appt.status },
  );
}

  async notifyHighUrgencyCase(c: Case) {
    const message = `URGENT (${c.urgency}): new case "${c.title}" needs a supervisor's attention`;
    this.server.to('role:supervisor').emit('notification:new', {
      id: `urgent-${c.id}`,
      type: 'case:high_urgency',
      message,
      meta: { caseId: c.id, urgency: c.urgency },
      read: false,
      createdAt: new Date(),
    });
  }

  async notifyNewCase(c: Case) {
  this.server.to('role:volunteer').emit('case:new', {
    id: c.id,
    title: c.title,
    status: c.status,
    createdAt: c.createdAt,
  });
}
}