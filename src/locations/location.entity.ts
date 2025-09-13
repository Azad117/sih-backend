import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tourist } from '../tourists/tourist.entity';
import type { Point }  from 'geojson'; // Import the Point type for GeoJSON

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tourist, (t) => t.locations,)
  @JoinColumn({ name: 'touristId' })
  tourist: Tourist;

  // --- REPLACED a single, indexed geography column ---
  // This aligns the location history with the PostGIS implementation.
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
   @Column('double precision')
   lat: number;

   @Column('double precision')
   lng: number;
  */

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
