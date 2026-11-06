import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly timeZone: string;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: Number(this.config.get<string>('MAIL_PORT')),
      // Authentification seulement si un identifiant est fourni (pas pour Mailpit)
      auth: user ? { user, pass } : undefined,
    });

    this.from = this.config.get<string>('MAIL_FROM') ?? 'no-reply@localhost';
    this.timeZone = this.config.get<string>('SCHOOL_TIMEZONE') ?? 'Africa/Dakar';
  }

  // Envoi générique : toutes les autres méthodes passent par celle-ci
  async send(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to, subject, html });
    this.logger.log(`Email envoyé à ${to} : ${subject}`);
  }

  // Envoi "sans risque" : une erreur est journalisée mais ne remonte pas
  async sendSafe(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.send(to, subject, html);
    } catch (error) {
      this.logger.error(`Échec d'envoi à ${to} : ${(error as Error).message}`);
    }
  }

  // Date lisible dans le fuseau de l'auto-école
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: this.timeZone,
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  }

  // Code de vérification d'inscription
  async sendVerificationCode(to: string, code: string): Promise<void> {
    const html = `
      <p>Bienvenue sur la plateforme de l'auto-école.</p>
      <p>Votre code de vérification est :</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:bold">${code}</p>
      <p>Ce code est valable 10 minutes. Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.</p>
    `;
    await this.send(to, 'Votre code de vérification', html);
  }

  // Lien de réinitialisation du mot de passe
  async sendPasswordReset(to: string, link: string): Promise<void> {
    const html = `
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p><a href="${link}">Cliquez ici pour choisir un nouveau mot de passe</a></p>
      <p>Ce lien est valable 30 minutes et ne peut servir qu'une fois.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe ne sera pas modifié.</p>
    `;
    await this.send(to, 'Réinitialisation de votre mot de passe', html);
  }

  // Confirmation après changement de mot de passe
  async sendPasswordChanged(to: string): Promise<void> {
    const html = `
      <p>Votre mot de passe vient d'être modifié.</p>
      <p>Si ce n'est pas vous, contactez immédiatement l'auto-école.</p>
    `;
    await this.send(to, 'Votre mot de passe a été modifié', html);
  }

  // Invitation envoyée à un moniteur par le gérant
  async sendInstructorInvitation(to: string, link: string): Promise<void> {
    const html = `
      <p>Vous avez été invité(e) à rejoindre l'auto-école en tant que moniteur.</p>
      <p><a href="${link}">Cliquez ici pour activer votre compte et choisir votre mot de passe</a></p>
      <p>Ce lien est valable 48 heures et ne peut servir qu'une fois.</p>
    `;
    await this.send(to, "Invitation à rejoindre l'auto-école", html);
  }

  // Confirmation de réservation
  async sendBookingConfirmation(
    to: string,
    info: { startsAt: Date; instructorName: string },
  ): Promise<void> {
    const html = `
      <p>Votre leçon de conduite est confirmée.</p>
      <p><strong>${this.formatDate(info.startsAt)}</strong><br>
      Moniteur : ${info.instructorName}</p>
      <p>Annulation gratuite jusqu'à 24 heures avant la leçon.</p>
    `;
    await this.sendSafe(to, 'Leçon confirmée', html);
  }

  // Confirmation d'annulation
  async sendCancellationNotice(
    to: string,
    info: { startsAt: Date; refunded: boolean },
  ): Promise<void> {
    const html = `
      <p>Votre leçon du <strong>${this.formatDate(info.startsAt)}</strong> a été annulée.</p>
      <p>${
        info.refunded
          ? 'Votre heure a été rendue à votre solde.'
          : "L'annulation étant tardive, l'heure n'est pas remboursée."
      }</p>
    `;
    await this.sendSafe(to, 'Leçon annulée', html);
  }
}