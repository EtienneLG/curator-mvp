import { Prisma } from '@prisma/client';
import type { Category, Status } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export interface CreateMediaItemData {
  content: string;
  status: Status;
}

export interface TriageMediaItemData {
  category: Category;
  title: string;
  year: number | null | undefined;
  creator: string | null | undefined;
  description: string | null | undefined;
}

export class ItemsRepository {
  async create(data: CreateMediaItemData) {
    return prisma.mediaItem.create({ data });
  }

  // Newest-first (createdAt DESC).
  async findByStatus(status: Status) {
    return prisma.mediaItem.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.mediaItem.findUnique({ where: { id } });
  }

  // Returns `null` when `id` does not match any MediaItem (Prisma P2025) instead of throwing,
  // so the service layer owns translating "not found" into a business exception.
  async updateTriage(id: string, data: TriageMediaItemData) {
    try {
      return await prisma.mediaItem.update({
        where: { id },
        data: { ...data, status: 'ORGANIZED' },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  // Returns `null` when `id` does not match any MediaItem, mirroring `updateTriage`.
  async delete(id: string) {
    try {
      return await prisma.mediaItem.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
}
