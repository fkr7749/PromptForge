import { prisma } from '@/lib/prisma'
import { NotificationType, Prisma } from '@promptforge/database'

export async function createNotification(params: {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Prisma.InputJsonValue
}) {
  return prisma.notification.create({ data: params })
}
