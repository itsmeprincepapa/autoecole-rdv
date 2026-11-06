import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OneTimeToken } from './one-time-token.entity';
import { TokensService } from './tokens.service';

@Module({
  imports: [TypeOrmModule.forFeature([OneTimeToken])],
  providers: [TokensService],
  // Exporté pour que AuthModule et le futur module d'invitation l'utilisent
  exports: [TokensService],
})
export class TokensModule {}