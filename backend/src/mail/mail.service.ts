import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

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
  }

  // Envoi générique : toutes les autres méthodes passent par celle-ci
  async send(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to, subject, html });
    this.logger.log(`Email envoyé à ${to} : ${subject}`);
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

  // Confirmation après changement de mot de passe (alerte en cas d'usage frauduleux)
  async sendPasswordChanged(to: string): Promise<void> {
    const html = `
      <p>Votre mot de passe vient d'être modifié.</p>
      <p>Si ce n'est pas vous, contactez immédiatement l'auto-école.</p>
    `;
    await this.send(to, 'Votre mot de passe a été modifié', html);
  }
}