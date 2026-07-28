import { Prisma } from '@prisma/client';
import type { Category, MediaType, Status } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

export interface CreateMediaItemData {
  content: string;
  type: MediaType;
  url: string | null;
  title: string | null;
  status: Status;
}

// The only place that touches `prisma.mediaItem` for the capture flow (DEC-004 / CONVENTIONS.md).
export class ItemsRepository {
  async create(data: CreateMediaItemData) {
    return prisma.mediaItem.create({ data });
  }

  // Inbox/Library are ordered newest-first (createdAt DESC per PROJECT.md).
  async findByStatus(status: Status) {
    return prisma.mediaItem.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Triage: sets `category` and `status = ORGANIZED` atomically (docs/PROJECT.md). Returns
  // `null` when `id` does not match any MediaItem (Prisma P2025) instead of throwing, so the
  // service layer owns translating "not found" into a business exception.
  async updateCategory(id: string, category: Category) {
    try {
      return await prisma.mediaItem.update({
        where: { id },
        data: { category, status: 'ORGANIZED' },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
}
