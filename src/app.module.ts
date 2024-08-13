import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffModule } from './staff/staff.module';
import { Staff} from './staff/staff.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'company.db',
      entities: [Staff],
      synchronize: true,
    }),
    StaffModule, 
  ],
})
export class AppModule {}