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
    joinedDate: string;
  
    @Column({ type: 'float' })
    baseSalary: number;
  
    @Column()
    type: string;
  
    @ManyToOne(() => Staff, { nullable: true })
    supervisor: Staff;
  }
  
