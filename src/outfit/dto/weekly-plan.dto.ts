import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/** Query params for GET /outfit/weekly and DELETE /outfit/weekly/:dayIndex */
export class GetWeekPlanQueryDto {
  /** Monday of the week in ISO date (YYYY-MM-DD). Defaults to current week. */
  @ApiPropertyOptional({ example: '2025-02-24' })
  @IsOptional()
  @IsString()
  weekStartDate?: string;
}
