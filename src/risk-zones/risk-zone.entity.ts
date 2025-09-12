import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('risk_zones')
export class RiskZone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('double precision')
  lat: number;

  @Column('double precision')
  lng: number;

  @Column('int', { default: 1000 })
  radius: number; // meters
}
