import { Test, TestingModule } from '@nestjs/testing';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { Repository } from 'typeorm';
import { Staff } from './staff.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('StaffController', () => {
  let controller: StaffController;
  let service: StaffService;
  let repository: Repository<Staff>;

  const mockStaffRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  });
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffController],
      providers: [
        StaffService,
        { provide: getRepositoryToken(Staff), useValue: mockStaffRepository() },
      ],
    }).compile();

    controller = module.get<StaffController>(StaffController);
    service = module.get<StaffService>(StaffService);
    repository = module.get<Repository<Staff>>(getRepositoryToken(Staff));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createStaff', () => {
    it('should create a new staff member', async () => {
      const staffDto = {
        name: 'John Doe',
        joinedDate: '2020-01-01',
        baseSalary: 1000,
        type: 'manager',
      };
      const createdStaff: Staff = { id: 1, ...staffDto, supervisor: null };

      jest.spyOn(repository, 'create').mockReturnValue(createdStaff);
      jest.spyOn(repository, 'save').mockResolvedValue(createdStaff);

      expect(await service.createStaff(staffDto)).toEqual(createdStaff);
    });

    it('should throw BadRequestException if supervisor is an employee', async () => {
      const staffDto = {
        name: 'John Doe',
        joinedDate: '2020-01-01',
        baseSalary: 1000,
        type: 'manager',
        supervisorId: 1,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue({ id: 1, type: 'employee' } as any);

      await expect(service.createStaff(staffDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStaff', () => {
    it('should update an existing staff member', async () => {
      const staffDto = { name: 'John Doe', type: 'manager' };
      const updatedStaff: Staff = { id: 1, ...staffDto, joinedDate: new Date().toISOString(), baseSalary: 1000, supervisor: null };

      jest.spyOn(repository, 'findOne').mockResolvedValue({ id: 1, joinedDate: new Date().toISOString(), baseSalary: 1000, supervisor: null } as any);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedStaff);

      expect(await service.updateStaff(1, staffDto)).toEqual(updatedStaff);
    });

    it('should throw BadRequestException if new supervisor is an employee', async () => {
      const staffDto = { supervisorId: 1 };

      jest.spyOn(repository, 'findOne').mockResolvedValue({ id: 1, type: 'employee' } as any);

      await expect(service.updateStaff(1, staffDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if staff member is not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.updateStaff(1, {})).rejects.toThrow(NotFoundException);
    });
  });


  describe('calculateSalary', () => {
    it('should calculate the salary correctly for employees', async () => {
      const staff: Staff = { id: 1, name: "Dave Free",type: 'employee', baseSalary: 1000, joinedDate: '2024-01-01', supervisor: null };
      const onDate = new Date('2024-01-01');
      jest.spyOn(repository, 'findOne').mockResolvedValue(staff);
      jest.spyOn(service as any, 'calculateEmployeeSalary').mockReturnValue(1150);

      expect(await service.calculateSalary(1, onDate)).toEqual(1150);
    });

  });

  describe('calculateSalary', () => {
    it('should calculate the salary correctly for staff members with subordinates after raises', async () => {
      const manager: Staff = {
        id: 1,
        name: 'Alice Manager',
        type: 'manager',
        baseSalary: 1000,
        joinedDate: '2022-01-01',
        supervisor: null,
      };
      const subordinate: Staff = {
        id: 2,
        name: 'Bob Subordinate',
        type: 'employee',
        baseSalary: 800,
        joinedDate: '2022-06-01',
        supervisor: manager,
      };
      const onDate = new Date('2024-01-01');
  
      const managerSalaryIncrement = 0.05; 
      const maxManagerIncrease = 0.40; 
      const subordinateSalaryIncrement = 0.03; 
      const maxSubordinateIncrease = 0.30; 
      const subordinateBonus = 0.005;
  
     
      jest.spyOn(repository, 'findOne').mockImplementation(async (options: any) => {
        const where = options.where as any; // :)
        if (where.id === manager.id) return manager;
        if (where.id === subordinate.id) return subordinate;
        return null;
      });
  
      jest.spyOn(repository, 'find').mockImplementation(async (options: any) => {
        if (options.where?.supervisor?.id === manager.id) {
          return [subordinate] as Staff[];
        }
        return [];
      });
  
     
      jest.spyOn(service as any, 'calculateEmployeeSalary').mockImplementation((staffId: number, date: Date) => {
        if (staffId === subordinate.id) {
          const yearsWorked = service.calculateYearsWorked(subordinate.joinedDate, date);
          const increment = Math.min(subordinate.baseSalary * (yearsWorked * subordinateSalaryIncrement), subordinate.baseSalary * maxSubordinateIncrease);
          return subordinate.baseSalary + increment;
        }
        return 0;
      });
  
    
      const managerSalary = await service.calculateSalary(manager.id, onDate);
  
      const yearsWorkedManager = service.calculateYearsWorked(manager.joinedDate, onDate);
      const incrementManager = Math.min(manager.baseSalary * (yearsWorkedManager * managerSalaryIncrement), manager.baseSalary * maxManagerIncrease);
      const subSalary = await service.calculateSalary(subordinate.id, onDate);
      const subordinateBonusTotal = subordinateBonus * subSalary;
      const expectedSalary = Math.min(incrementManager + subordinateBonusTotal+manager.baseSalary, manager.baseSalary * (1 + maxManagerIncrease));
  
      
      expect(managerSalary).toEqual(expectedSalary);
    });
  });
  
});
