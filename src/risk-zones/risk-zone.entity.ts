import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { Point } from 'geojson';

@Entity('risk_zones')
export class RiskZone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  /**
   * UPDATED: The location of the zone's center is now stored
   * in a single, spatially-indexed 'location' column.
   */
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326, // WGS 84 GPS coordinate system
  })
  location: Point;

  /**
   * The radius of the risk zone in meters.
   */
  @Column('int')
  radius: number; // in meters

  // --- The old lat and lng columns are now removed ---
  // @Column('double precision')
  // lat: number;
  //
  // @Column('double precision')
  // lng: number;
}
