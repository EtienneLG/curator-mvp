import type { MediaType, Status } from '@prisma/client';

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
}
