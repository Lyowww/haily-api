import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthGuard } from './admin-auth.guard';
import { PrismaService } from '../prisma';
import { ADMIN_TABLE_NAMES, type AdminTableName } from './admin-tables.config';

@ApiTags('Admin Dashboard – Tables')
@Controller('admin-dashboard/tables')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth('admin')
export class AdminTablesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List available table names' })
  listTables(): { tables: AdminTableName[] } {
    return { tables: [...ADMIN_TABLE_NAMES] };
  }

  @Get(':table')
  @ApiOperation({ summary: 'List rows with optional pagination' })
  async listRows(
    @Param('table') table: string,
    @Query('skip') skipStr?: string,
    @Query('take') takeStr?: string,
  ) {
    const model = this.getModel(table);
    const skip = Math.max(0, parseInt(skipStr ?? '0', 10) || 0);
    const take = Math.min(100, Math.max(1, parseInt(takeStr ?? '20', 10) || 20));
    const orderBy = this.getOrderBy(model);
    const delegate = (this.prisma as any)[model];
    const [rows, total] = await Promise.all([
      orderBy ? delegate.findMany({ skip, take, orderBy }) : delegate.findMany({ skip, take }),
      delegate.count(),
    ]);
    const serialized = rows.map((r: any) => this.serializeRow(r));
    return { data: serialized, total, skip, take };
  }

  private getOrderBy(model: string): Record<string, string> | [Record<string, string>] | null {
    if (model === 'outfitItem') return [{ outfitId: 'desc' as const }];
    if (['creditsLedger', 'helpCenterMessage'].includes(model)) return { createdAt: 'desc' };
    try {
      return { createdAt: 'desc' };
    } catch {
      return { id: 'desc' };
    }
  }

  @Get(':table/:id')
  @ApiOperation({ summary: 'Get one row by id (or composite key for outfitItem)' })
  async getOne(@Param('table') table: string, @Param('id') id: string) {
    const model = this.getModel(table);
    if (model === 'outfitItem') {
      const [outfitId, wardrobeItemId] = id.includes('|') ? id.split('|') : id.split('-');
      if (!outfitId || !wardrobeItemId) throw new BadRequestException('outfitItem requires outfitId|wardrobeItemId');
      const row = await (this.prisma as any).outfitItem.findUnique({
        where: { outfitId_wardrobeItemId: { outfitId, wardrobeItemId } },
      });
      if (!row) throw new NotFoundException('Not found');
      return this.serializeRow(row);
    }
    const row = await (this.prisma as any)[model].findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Not found');
    return this.serializeRow(row);
  }

  @Post(':table')
  @ApiOperation({ summary: 'Create a row' })
  async create(@Param('table') table: string, @Body() body: Record<string, unknown>) {
    const model = this.getModel(table);
    const data = this.buildData(table, body, false);
    const created = await (this.prisma as any)[model].create({ data });
    return this.serializeRow(created);
  }

  @Patch(':table/:id')
  @ApiOperation({ summary: 'Update a row' })
  async update(
    @Param('table') table: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const model = this.getModel(table);
    const data = this.buildData(table, body, true);
    if (model === 'outfitItem') {
      const [outfitId, wardrobeItemId] = id.includes('|') ? id.split('|') : id.split('-');
      if (!outfitId || !wardrobeItemId) throw new BadRequestException('outfitItem requires outfitId|wardrobeItemId');
      const updated = await (this.prisma as any).outfitItem.update({
        where: { outfitId_wardrobeItemId: { outfitId, wardrobeItemId } },
        data: data as any,
      });
      return this.serializeRow(updated);
    }
    const updated = await (this.prisma as any)[model].update({ where: { id }, data });
    return this.serializeRow(updated);
  }

  @Delete(':table/:id')
  @ApiOperation({ summary: 'Delete a row' })
  async delete(@Param('table') table: string, @Param('id') id: string) {
    const model = this.getModel(table);
    if (model === 'outfitItem') {
      const [outfitId, wardrobeItemId] = id.includes('|') ? id.split('|') : id.split('-');
      if (!outfitId || !wardrobeItemId) throw new BadRequestException('outfitItem requires outfitId|wardrobeItemId');
      await (this.prisma as any).outfitItem.delete({
        where: { outfitId_wardrobeItemId: { outfitId, wardrobeItemId } },
      });
      return { deleted: true, id };
    }
    await (this.prisma as any)[model].delete({ where: { id } });
    return { deleted: true, id };
  }

  private getModel(table: string): string {
    const normalized = table as AdminTableName;
    if (!ADMIN_TABLE_NAMES.includes(normalized)) {
      throw new BadRequestException(`Unknown table: ${table}`);
    }
    return normalized;
  }

  private serializeRow(row: any): Record<string, unknown> {
    if (!row) return {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v instanceof Date) {
        out[k] = (v as Date).toISOString();
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  private buildData(table: string, body: Record<string, unknown>, isUpdate: boolean): Record<string, unknown> {
    const omit = new Set(['id', 'createdAt', ...(isUpdate ? [] : [])]);
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (omit.has(key)) continue;
      if (value === undefined) continue;
      if (isUpdate && value === null) {
        data[key] = null;
        continue;
      }
      if (typeof value === 'string' && (key.endsWith('At') || key === 'createdAt' || key === 'updatedAt')) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) data[key] = d;
        else data[key] = value;
      } else {
        data[key] = value;
      }
    }
    return data;
  }
}
