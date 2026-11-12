import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Encode un texte avec accents pour un en-tête de mail
const encodeHeader = (text: string) =>
  `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`;

// Évite qu'un nom saisi par un utilisateur injecte du HTML dans un mail
const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  // Présent seulement en mode SMTP (développement avec Mailpit)
  private readonly transporter?: Transporter;
  private readonly provider: 'smtp' | 'gmail-api';
  private readonly from: string;
  private readonly timeZone: string;
  private gmailToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {
    this.provider =
      this.config.get<string>('MAIL_PROVIDER') === 'gmail-api' ? 'gmail-api' : 'smtp';

    if (this.provider === 'smtp') {
      const user = this.config.get<string>('MAIL_USER');
      const pass = this.config.get<string>('MAIL_PASSWORD');

      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('MAIL_HOST'),
        port: Number(this.config.get<string>('MAIL_PORT')),
        // Authentification seulement si un identifiant est fourni (pas pour Mailpit)
        auth: user ? { user, pass } : undefined,
      });
    } else {
      // On vérifie au démarrage que la configuration Gmail est complète
      for (const key of [
        'GMAIL_CLIENT_ID',
        'GMAIL_CLIENT_SECRET',
        'GMAIL_REFRESH_TOKEN',
        'GMAIL_USER',
      ]) {
        if (!this.config.get<string>(key)) {
          throw new Error(`Variable d'environnement manquante : ${key}`);
        }
      }
    }

    this.from = this.config.get<string>('MAIL_FROM') ?? 'no-reply@localhost';
    this.timeZone = this.config.get<string>('SCHOOL_TIMEZONE') ?? 'Africa/Dakar';
  }

  // Envoi générique : toutes les autres méthodes passent par celle-ci
  async send(to: string, subject: string, html: string): Promise<void> {
    if (this.provider === 'gmail-api') {
      await this.sendWithGmailApi(to, subject, html);
    } else {
      await this.transporter!.sendMail({ from: this.from, to, subject, html });
    }
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

  // --- API Gmail (HTTPS) : fonctionne sur Render gratuit, contrairement au SMTP ---

  private async getGmailAccessToken(): Promise<string> {
    if (this.gmailToken && Date.now() < this.gmailToken.expiresAt - 60_000) {
      return this.gmailToken.value;
    }
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.get<string>('GMAIL_CLIENT_ID')!,
        client_secret: this.config.get<string>('GMAIL_CLIENT_SECRET')!,
        refresh_token: this.config.get<string>('GMAIL_REFRESH_TOKEN')!,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`Gmail : jeton refusé (${res.status}), régénérez le refresh token`);
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.gmailToken = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return this.gmailToken.value;
  }

  private async sendWithGmailApi(to: string, subject: string, html: string): Promise<void> {
    // L'adresse vient d'un formulaire : aucun saut de ligne (injection d'en-têtes)
    if (/[\r\n]/.test(to)) throw new Error('Adresse destinataire invalide');

    const fromEmail = this.config.get<string>('GMAIL_USER')!;
    const fromName = this.config.get<string>('MAIL_FROM_NAME') ?? "Auto-école";

    const message = [
      `From: ${encodeHeader(fromName)} <${fromEmail}>`,
      `To: ${to}`,
      `Subject: ${encodeHeader(subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(html, 'utf8')
        .toString('base64')
        .replace(/(.{76})/g, '$1\r\n'),
    ].join('\r\n');

    const accessToken = await this.getGmailAccessToken();
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ raw: Buffer.from(message).toString('base64url') }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`Gmail : envoi échoué (${res.status}) ${await res.text()}`);
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
      Moniteur : ${escapeHtml(info.instructorName)}</p>
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