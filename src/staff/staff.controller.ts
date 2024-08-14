
import { Controller, Query, Get, Post, Put, Delete, Body, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { Staff } from './staff.entity';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}


  @Get('total-salary')
  async getAllSalaries(
    @Query('date') date: string
  ): Promise<number> {
    const onDate = new Date(date);
    return this.staffService.calculateTotalSalaries(onDate);
  }

  @Get(':id/salary')
  async getSalary(
    @Param('id') id: number,
    @Query('date') date: string
  ): Promise<number> {
    const onDate = new Date(date);
    return this.staffService.calculateSalary(id, onDate);
  }


  @Get(':id/subordinates')
  async getStaffSubordinates(@Param('id') id: number): Promise<Staff[]> {
    return this.staffService.getSubordinates(id);
  }

  @Get(':id/all-subordinates')
  async getAllStaffSubordinates(@Param('id') id: number): Promise<Staff[]> {
    return this.staffService.getAllSubordinates(id);
  }
  
  @Post()
  async createStaff(@Body() staffDto: {
    name: string;
    joinedDate: Date;
    baseSalary: number;
    type: string;
    supervisorId?: number;
  }): Promise<Staff> {
    try {
      if(new Date(staffDto.joinedDate).getTime() && Number(staffDto.baseSalary)){
      return await this.staffService.createStaff(staffDto);
      }
      else{
        throw new BadRequestException("Bad Request. Use YYYY-MM-DD for Date. Use numberic values for Salary");
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get(':id')
  async getStaffById(@Param('id') id: number): Promise<any> {
    try {
      const staff = await this.staffService.getStaffById(id);
      return {
        id: staff.id,
        name: staff.name,
        joinedDate: staff.joinedDate,
        baseSalary: staff.baseSalary,
        type: staff.type,
        supervisorId: staff.supervisor ? staff.supervisor.id : null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get()
  async findAll(): Promise<Partial<Staff>[]> {
    return this.staffService.findAll();
  }

  @Put(':id')
  async updateStaff(
    @Param('id') id: number,
    @Body() updateDto: {
      name?: string;
      joinedDate?: Date;
      baseSalary?: number;
      type?: string;
      supervisorId?: number;
    }
  ): Promise<Staff> {
    try {
      if(new Date(updateDto.joinedDate).getTime() && Number(updateDto.baseSalary)){
      return await this.staffService.updateStaff(id,updateDto);
      }
      else{
        throw new BadRequestException("Bad Request. Use YYYY-MM-DD for Date. Use numberic values for Salary");}
      } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  async deleteStaff(@Param('id') id: number): Promise<void> {
    try {
      await this.staffService.deleteStaff(id);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }


}
