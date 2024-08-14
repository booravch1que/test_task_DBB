// src/staff/staff.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
  } from 'typeorm';
  
  @Entity()
  export class Staff {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    name: string;
  
    @Column({ type: 'date' })
    joinedDate: Date;
  
    @Column({ type: 'float' })
    baseSalary: number;
  
    @Column()
    type: string;
  
    @ManyToOne(() => Staff, { nullable: true })
    supervisor: Staff;
  }
  