import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tourist } from '../tourists/tourist.entity';
import { Alert } from '../alerts/alerts.entity';
import { AlertsGateway } from '../alerts/alerts.gateway';
import { PoliceStationsService } from '../police-stations/police-station.service'; // Import the service

@Injectable()
export class PanicService {
  constructor(
    @InjectRepository(Tourist) private touristRepo: Repository<Tourist>,
    @InjectRepository(Alert) private alertRepo: Repository<Alert>,
    private alertsGateway: AlertsGateway,
    // Inject the PoliceStationsService instead of its repository
    private policeStationsService: PoliceStationsService,
  ) {}

  async triggerPanic(touristId: string, lat: number, lng: number): Promise<Alert> {
    const tourist = await this.touristRepo.findOneBy({ touristId });
    if (!tourist) {
      throw new NotFoundException(`Tourist with ID "${touristId}" not found`);
    }

    // --- REFACTORED LOGIC ---
    // Reuse the existing, efficient findNearby method from the other service.
    const nearbyStations = await this.policeStationsService.findNearby(lat, lng);
    
    // The findNearby method returns an array, so we take the first element.
    const nearestStation = nearbyStations[0];

    if (!nearestStation) {
      throw new NotFoundException('No nearby police stations found to handle the panic alert.');
    }

    // The rest of the logic remains the same
    const panicAlert = this.alertRepo.create({
      tourist,
      policeStation: nearestStation,    
      severity: 'PANIC_BUTTON',
      zoneName: 'SOS/Panic Event',
      distanceMeters: 0,
    });

    await this.alertRepo.save(panicAlert);
    
    this.alertsGateway.sendPanicAlertToPolice(nearestStation.id, {
      id: panicAlert.id,
      touristId: tourist.touristId,
      touristName: tourist.name,
      location: { lat, lng },
      severity: panicAlert.severity,
      createdAt: panicAlert.createdAt,
    });

    return panicAlert;
  }
}

