import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateUserDto, AssignAccountsDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly realtime: RealtimeService
  ) {}

  /**
   * List all user profiles with account counts and connection info
   */
  async listUsers(organizationId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const cacheKey = `users:list:${orgId}`;

    return this.cache.wrap(cacheKey, async () => {
      const users = await this.prisma.userProfile.findMany({
        where: { organizationId: orgId },
        include: {
          adAccountAccess: {
            include: {
              adAccount: {
                select: {
                  id: true,
                  metaAdAccountId: true,
                  name: true,
                  internalAlias: true,
                  normalizedStatus: true,
                  currentTrackedBalanceMinor: true
                }
              }
            }
          },
          metaConnections: {
            select: {
              id: true,
              internalName: true,
              connectionStatus: true,
              lastSuccessfulSyncAt: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      return users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        assignedAccountsCount: u.adAccountAccess.length,
        connectedFacebookAccountsCount: u.metaConnections.length,
        assignedAccounts: u.adAccountAccess.map((acc) => ({
          id: acc.adAccount.id,
          metaAdAccountId: acc.adAccount.metaAdAccountId,
          name: acc.adAccount.name,
          alias: acc.adAccount.internalAlias,
          status: acc.adAccount.normalizedStatus,
          balanceINR: (Number(acc.adAccount.currentTrackedBalanceMinor) / 100).toFixed(2),
          accessRole: acc.accessRole
        })),
        metaConnections: u.metaConnections
      }));
    }, 60);
  }

  /**
   * Admin creates a new Ads Manager / User with hashed password
   */
  async createUser(dto: CreateUserDto) {
    const orgId = await this.prisma.resolveOrgId(dto.organizationId);

    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.userProfile.findFirst({
      where: {
        organizationId: orgId,
        email: normalizedEmail
      }
    });

    if (existingUser) {
      throw new ConflictException(`User with email "${normalizedEmail}" already exists in this organization`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password.trim(), salt);

    const newUser = await this.prisma.userProfile.create({
      data: {
        organizationId: orgId,
        authUserId: `auth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: dto.name.trim(),
        email: normalizedEmail,
        passwordHash: passwordHash,
        role: dto.role || 'ADS_MANAGER',
        status: 'ACTIVE'
      }
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        organizationId: orgId,
        actorUserId: newUser.id,
        action: 'ADMIN_CREATE_USER',
        entityType: 'USER_PROFILE',
        entityId: newUser.id,
        newState: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      }
    });

    await this.cache.delPattern('users:*');
    await this.cache.delPattern('meta:*');
    await this.cache.delPattern('reports:*');

    // Broadcast live event to all connected browsers
    this.realtime.broadcast('USERS_UPDATED', { organizationId: orgId, userId: newUser.id });
    this.realtime.broadcast('META_ASSETS_UPDATED', { organizationId: orgId });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt
    };
  }

  /**
   * Update User Status (ACTIVE / SUSPENDED)
   */
  async updateUserStatus(userId: string, status: string) {
    const user = await this.prisma.userProfile.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const updated = await this.prisma.userProfile.update({
      where: { id: userId },
      data: { status }
    });

    await this.cache.delPattern('users:*');
    await this.cache.delPattern('auth:*');
    await this.cache.delPattern('meta:*');
    await this.cache.delPattern('reports:*');

    // Broadcast live event to all connected browsers
    this.realtime.broadcast('USERS_UPDATED', { organizationId: user.organizationId, userId });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      status: updated.status
    };
  }

  /**
   * Assign or update ad accounts for an Ads Manager
   */
  async assignAdAccounts(userId: string, dto: AssignAccountsDto) {
    const user = await this.prisma.userProfile.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    // Reset old mappings and add new mappings cleanly
    await this.prisma.userAdAccountAccess.deleteMany({
      where: { userId }
    });

    const results: any[] = [];
    for (const adAccountId of dto.adAccountIds) {
      const access = await this.prisma.userAdAccountAccess.create({
        data: {
          organizationId: user.organizationId,
          userId: userId,
          adAccountId: adAccountId,
          accessRole: dto.accessRole || 'OWNER'
        }
      });
      results.push(access);
    }

    await this.cache.delPattern('users:*');
    await this.cache.delPattern('meta:*');
    await this.cache.delPattern('reports:*');

    // Broadcast live event to all connected browsers
    this.realtime.broadcast('USERS_UPDATED', { organizationId: user.organizationId, userId });
    this.realtime.broadcast('META_ASSETS_UPDATED', { organizationId: user.organizationId });

    return {
      message: `Assigned ${results.length} ad accounts to ${user.name}`,
      count: results.length
    };
  }

  /**
   * Remove specific ad account access from an Ads Manager
   */
  async removeAdAccountAccess(userId: string, adAccountId: string) {
    const user = await this.prisma.userProfile.findUnique({ where: { id: userId } });
    await this.prisma.userAdAccountAccess.deleteMany({
      where: {
        userId: userId,
        adAccountId: adAccountId
      }
    });

    await this.cache.delPattern('users:*');
    await this.cache.delPattern('meta:*');
    await this.cache.delPattern('reports:*');

    if (user) {
      this.realtime.broadcast('USERS_UPDATED', { organizationId: user.organizationId, userId });
      this.realtime.broadcast('META_ASSETS_UPDATED', { organizationId: user.organizationId });
    }

    return { message: 'Access revoked successfully' };
  }

  /**
   * Admin: Delete User cleanly
   */
  async deleteUser(userId: string, organizationId?: string) {
    const user = await this.prisma.userProfile.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    // 1. Clean up user ad account access
    await this.prisma.userAdAccountAccess.deleteMany({ where: { userId } });
    await this.prisma.userPortfolioAccess.deleteMany({ where: { userId } });

    // 2. Unbind Meta connections from this user (keep the connection record or disconnect)
    await this.prisma.metaConnection.updateMany({
      where: { userId },
      data: { userId: null }
    });

    // 3. Remove sessions & devices
    await this.prisma.webSession.deleteMany({ where: { userId } });
    await this.prisma.extensionDevice.deleteMany({ where: { userId } });

    // 4. Delete user profile
    await this.prisma.userProfile.delete({ where: { id: userId } });

    await this.cache.delPattern('users:*');
    await this.cache.delPattern('auth:*');
    await this.cache.delPattern('meta:*');
    await this.cache.delPattern('reports:*');

    // 5. Broadcast realtime updates
    this.realtime.broadcast('USERS_UPDATED', { organizationId: user.organizationId, userId });
    this.realtime.broadcast('META_ASSETS_UPDATED', { organizationId: user.organizationId });

    return { success: true, message: `User "${user.name}" (${user.email}) deleted successfully.` };
  }

  /**
   * Get single user details
   */
  async getUserDetails(userId: string) {
    const user = await this.prisma.userProfile.findUnique({
      where: { id: userId },
      include: {
        adAccountAccess: {
          include: {
            adAccount: true
          }
        },
        metaConnections: true
      }
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      assignedAccounts: user.adAccountAccess.map((a) => a.adAccount),
      metaConnections: user.metaConnections
    };
  }
}
