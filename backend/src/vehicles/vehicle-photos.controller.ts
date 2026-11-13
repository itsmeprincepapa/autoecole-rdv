import { Controller, Get, Header, Param, ParseUUIDPipe, StreamableFile } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';

// Affiche la photo d'un véhicule : GET /vehicle-photos/<id>
// Route publique : une balise <img> ne peut pas envoyer de jeton de connexion.
@Controller('vehicle-photos')
export class VehiclePhotosController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async getPhoto(@Param('id', ParseUUIDPipe) id: string) {
    const { data, mime } = await this.vehiclesService.getPhoto(id);
    return new StreamableFile(data, { type: mime });
  }
}