import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Staff } from './staff.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
  ) {}

  private validateType(type: string): void {
    const allowedTypes = ['employee', 'manager', 'sales'];
    if (!allowedTypes.includes(type)) {
      throw new BadRequestException(`Invalid type: ${type}. Allowed types are 'employee', 'manager', 'sales'.`);
    }
  }

  async createStaff(staffDto: {
    name: string;
    joinedDate: Date;
    baseSalary: number;
    type: string;
    supervisorId?: number;
  }): Promise<Staff> {
    this.validateType(staffDto.type);

    const { supervisorId, ...staffData } = staffDto;

    const staff = this.staffRepo.create(staffData);

    if (supervisorId) {
      const supervisor = await this.staffRepo.findOne({ where: { id: supervisorId } });
      if (!supervisor) {
        throw new BadRequestException(`Supervisor with ID ${supervisorId} not found`);
      }

      if (supervisor.type === 'employee') {
        throw new BadRequestException(`Cannot assign an Employee as a supervisor`);
      }

      staff.supervisor = supervisor;
    }

    return this.staffRepo.save(staff);
  }

  async updateStaff(id: number, updateDto: {
    name?: string;
    joinedDate?: Date;
    baseSalary?: number;
    type?: string;
    supervisorId?: number;
  }): Promise<Staff> {
    const staff = await this.staffRepo.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    if (updateDto.type) {
      this.validateType(updateDto.type);
    }

    if (updateDto.supervisorId !== undefined) {
      const newSupervisor = await this.staffRepo.findOne({ where: { id: updateDto.supervisorId } });
      if (!newSupervisor) {
        throw new BadRequestException(`New supervisor with ID ${updateDto.supervisorId} not found`);
      }

      if (newSupervisor.type === 'employee') {
        throw new BadRequestException(`New supervisor cannot be an Employee`);
      }

      staff.supervisor = newSupervisor;
    }

    Object.assign(staff, updateDto);
    return this.staffRepo.save(staff);
  }
  

  async deleteStaff(id: number): Promise<void> {
    const staff = await this.staffRepo.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }
    await this.staffRepo.createQueryBuilder()
      .update(Staff)
      .set({ supervisor: null })
      .where('supervisorId = :id', { id })
      .execute();

    await this.staffRepo.delete(id);
  }

  async getStaffById(id: number): Promise<Staff> {
    const staff = await this.staffRepo.findOne({
      where: { id },
      relations: ['supervisor'], 
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return staff;
  }

  async findAll(): Promise<Partial<Staff>[]> {
    const staffMembers = await this.staffRepo.find({ relations: ['supervisor'] });
    return staffMembers.map((staff) => ({
      id: staff.id,
      name: staff.name,
      joinedDate: staff.joinedDate,
      baseSalary: staff.baseSalary,
      type: staff.type,
      supervisorId: staff.supervisor ? staff.supervisor.id : null, 
    }));
  }

    calculateYearsWorked(date: string, onDate: Date): number {
    const joinedDate = new Date(date);
    const yearsWorked = onDate.getFullYear() - joinedDate.getFullYear();
    const hasAnniversaryPassed = 
      onDate.getMonth() > joinedDate.getMonth() ||
      (onDate.getMonth() === joinedDate.getMonth() && onDate.getDate() >= joinedDate.getDate());
      
    return hasAnniversaryPassed ? yearsWorked : yearsWorked - 1;
  }

  private calculateEmployeeSalary(baseSalary: number, yearsWorked: number): number {
    const maxPercentage = 0.3; 
    const salaryIncrease = Math.min(0.03 * yearsWorked, maxPercentage) * baseSalary;
    return baseSalary + salaryIncrease;
}

private async calculateManagerSalary(staff: Staff, onDate: Date): Promise<number> {
    const baseSalary = staff.baseSalary;
    const yearsWorked = this.calculateYearsWorked(staff.joinedDate.toString(), onDate);

    const maxPercentage = 0.4;
    const salaryIncrease = Math.min(0.05 * yearsWorked, maxPercentage) * baseSalary;


    const subordinates = await this.staffRepo.find({ where: { supervisor: { id: staff.id } } });
    const subordinatesSalaries = await Promise.all(
        subordinates.map(sub => this.calculateSalary(sub.id, onDate))
    );
    const subordinatesSalaryBonus = 0.005 * subordinatesSalaries.reduce((acc, salary) => acc + salary, 0);

    return baseSalary + salaryIncrease + subordinatesSalaryBonus;
}

private async calculateSalesSalary(staff: Staff, onDate: Date): Promise<number> {
    const baseSalary = staff.baseSalary;
    const yearsWorked = this.calculateYearsWorked(staff.joinedDate.toString(), onDate);

    const maxPercentage = 0.35; 
    const salaryIncrease = Math.min(0.01 * yearsWorked, maxPercentage) * baseSalary;

 
    const subordinatesSalaries = await this.calculateRecursiveSubordinatesSalary(staff.id, onDate);
    const subordinatesSalaryBonus = 0.003 * subordinatesSalaries;

    return baseSalary + salaryIncrease + subordinatesSalaryBonus;
}

private async calculateRecursiveSubordinatesSalary(supervisorId: number, onDate: Date): Promise<number> {
    const subordinates = await this.staffRepo.find({ where: { supervisor: { id: supervisorId } } });
    const subordinatesSalaries = await Promise.all(
        subordinates.map(sub => this.calculateSalary(sub.id, onDate))
    );

    let totalSubordinatesSalaries = subordinatesSalaries.reduce((acc, salary) => acc + salary, 0);

    for (const sub of subordinates) {
        totalSubordinatesSalaries += await this.calculateRecursiveSubordinatesSalary(sub.id, onDate);
    }

    return totalSubordinatesSalaries;
}

async calculateSalary(staffId: number, onDate: Date): Promise<number> {
    const staff = await this.staffRepo.findOne({ where: { id: staffId }, relations: ['supervisor'] });
    if (!staff) {
        throw new NotFoundException(`Staff member with ID ${staffId} not found`);
    }

    const yearsWorked = this.calculateYearsWorked(staff.joinedDate.toString(), onDate);

    switch (staff.type) {
        case 'employee':
            return this.calculateEmployeeSalary(staff.baseSalary, yearsWorked);
        case 'manager':
            return this.calculateManagerSalary(staff, onDate);
        case 'sales':
            return this.calculateSalesSalary(staff, onDate);
        default:
            console.log(staff.type);
            throw new Error('Unknown staff type');
    }
}


  async calculateTotalSalaries(onDate: Date): Promise<number> {
    const staffMembers = await this.staffRepo.find();
    const salaryPromises = staffMembers.map(staff => this.calculateSalary(staff.id, onDate));
    const salaries = await Promise.all(salaryPromises);
    return salaries.reduce((total, salary) => total + salary, 0);
  }

  async getSubordinates(supervisorId: number): Promise<Staff[]> {
    return this.staffRepo.createQueryBuilder('staff')
      .where('staff.supervisorId = :supervisorId', { supervisorId })
      .getMany();
  }

  async getAllSubordinates(supervisorId: number): Promise<Staff[]> {
    const directSubordinates = await this.getSubordinates(supervisorId);
    let allSubordinates = [...directSubordinates];

    for (const subordinate of directSubordinates) {
      const subSubordinates = await this.getAllSubordinates(subordinate.id);
      allSubordinates = allSubordinates.concat(subSubordinates);
    }

    return allSubordinates;
  }
}
