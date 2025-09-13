import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Alert } from '../alerts/alerts.entity';
import type { Point } from 'geojson'; // Import the Point type for GeoJSON

@Entity('police_stations')
export class PoliceStation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // --- REPLACED a single, indexed geography column ---
  // The 'geography' type is optimized for real-world lat/lng calculations.
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326, // WGS 84: the standard for GPS coordinates
    nullable: true, // It's good practice to allow this to be nullable initially
  })
  location: Point;

  /*
   --- DEPRECATED ---
   The old lat and lng columns are no longer needed.
   @Column('double precision')
   lat: number;

   @Column('double precision')
   lng: number;
  */

  // jurisdiction radius in meters
  @Column('int', { default: 30000 })
  jurisdictionRadius: number;

  // relation with alerts
  @OneToMany(() => Alert, (alert) => alert.policeStation)
  alerts: Alert[];
}
