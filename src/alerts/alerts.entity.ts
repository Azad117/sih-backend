import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tourist } from '../tourists/tourist.entity';
import { PoliceStation } from '../police-stations/police-station.entity';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  touristId: number;

  @Column()
  stationId: number;

  @ManyToOne(() => Tourist, (t) => t.alerts, { eager: true })
  @JoinColumn({ name: 'touristId' })
  tourist: Tourist;

  @ManyToOne(() => PoliceStation, (s) => s.alerts, { eager: true })
  @JoinColumn({ name: 'stationId' })
  policeStation: PoliceStation;

  @Column()
  zoneName: string;

  @Column()
  severity: string; // e.g. WARNING | CRITICAL_700 | CRITICAL_500

  @Column('int')
  distanceMeters: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
