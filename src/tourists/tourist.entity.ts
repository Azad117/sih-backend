import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Location } from '../locations/location.entity';
import { Alert } from '../alerts/alerts.entity';

@Entity('tourists')
export class Tourist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  touristId: string; // e.g., T-001 (secured via blockchain hash in real impl)

  @Column()
  name: string;

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ type: 'double precision', nullable: true })
  lat?: number;

  @Column({ type: 'double precision', nullable: true })
  lng?: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated?: Date;

  @Column({ default: 80 })
  safetyScore: number;

  // Digital ID validity
  @Column({ type: 'timestamp', nullable: false })
  validFrom: Date;

  @Column({ type: 'timestamp', nullable: false })
  validTo: Date;

  @OneToMany(() => Location, (loc) => loc.tourist)
  locations: Location[];

  @OneToMany(() => Alert, (a) => a.tourist)
  alerts: Alert[];
}
