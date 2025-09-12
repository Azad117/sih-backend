import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Alert } from '../alerts/alerts.entity';

@Entity('police_stations')
export class PoliceStation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // center of jurisdiction
  @Column('double precision')
  lat: number;

  @Column('double precision')
  lng: number;

  // jurisdiction radius in meters
  @Column('int', { default: 5000 })
  jurisdictionRadius: number;

  // relation with alerts
  @OneToMany(() => Alert, (alert) => alert.policeStation)
  alerts: Alert[];
}
