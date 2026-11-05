import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  // On exporte le service pour que AuthModule puisse l'utiliser
  exports: [MailService],
})
export class MailModule {}