import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Location } from '../locations/location.entity';
import { Alert } from '../alerts/alerts.entity';
import type { Point } from 'geojson'; // Import the Point type for GeoJSON

@Entity('tourists')
export class Tourist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  touristId: string; // e.g., T-001 (secured via blockchain hash in real impl)

  @Column({ nullable: true }) // Can be nullable if tourist is created on first location ping
  name: string;

  @Column({ nullable: true })
  emergencyContact: string;

  // --- REPLACED a single, indexed geography column for last known position ---
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326, // WGS 84: the standard for GPS coordinates
    nullable: true,
  })
  location: Point;

  /*
   --- DEPRECATED ---
   The old lat and lng columns are no longer needed.
   @Column({ type: 'double precision', nullable: true })
   lat?: number;

   @Column({ type: 'double precision', nullable: true })
   lng?: number;
  */

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated?: Date;

  @Column({ default: 80 })
  safetyScore: number;

  // Digital ID validity
  @Column({ type: 'timestamp', nullable: true }) // Made nullable for flexibility
  validFrom: Date;

  @Column({ type: 'timestamp', nullable: true }) // Made nullable for flexibility
  validTo: Date;

  @OneToMany(() => Location, (loc) => loc.tourist)
  locations: Location[];

  @OneToMany(() => Alert, (a) => a.tourist)
  alerts: Alert[];
}
