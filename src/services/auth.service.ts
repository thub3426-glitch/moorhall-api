import prisma from '../config/db';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyToken, generateResetToken } from '../utils/token';
import ApiError from '../utils/apiError';
import emailService from '../emails/services/email.service';
import { RegisterInput, LoginInput, ChangePasswordInput, UpdateProfileInput, ForgotPasswordInput, ResetPasswordInput, TokenPair } from '../types/auth.types';

interface AdminWithoutPassword {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminWithResetToken {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  status: string;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

class AuthService {
  async register(input: RegisterInput): Promise<{ admin: AdminWithoutPassword; tokens: TokenPair }> {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: input.email },
    });

    if (existingAdmin) {
      throw ApiError.conflict('Email already registered');
    }

    if (input.phoneNumber) {
      const existingPhone = await prisma.admin.findUnique({
        where: { phoneNumber: input.phoneNumber },
      });

      if (existingPhone) {
        throw ApiError.conflict('Phone number already registered');
      }
    }

    const passwordHash = await hashPassword(input.password);

    const admin = await prisma.admin.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phoneNumber: input.phoneNumber || null,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const tokens = this.generateTokens(admin);

    return { admin, tokens };
  }

  async login(input: LoginInput): Promise<{ admin: AdminWithoutPassword; tokens: TokenPair }> {
    const admin = await prisma.admin.findUnique({
      where: { email: input.email },
    });

    if (!admin) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (admin.status === 'SUSPENDED') {
      throw ApiError.forbidden('Account is suspended');
    }

    const isPasswordValid = await comparePassword(input.password, admin.passwordHash);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const tokens = this.generateTokens(updatedAdmin);

    return { admin: updatedAdmin, tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw ApiError.internal('Refresh token secret not configured');
    }

    const payload = verifyToken(refreshToken, secret);

    const admin = await prisma.admin.findUnique({
      where: { id: payload.id },
    });

    if (!admin) {
      throw ApiError.unauthorized('Admin not found');
    }

    if (admin.status === 'SUSPENDED') {
      throw ApiError.forbidden('Account is suspended');
    }

    const tokens = this.generateTokens({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      fullName: admin.fullName,
      status: admin.status,
      phoneNumber: admin.phoneNumber,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });

    return tokens;
  }

  async logout(adminId: number): Promise<void> {
    await prisma.admin.update({
      where: { id: adminId },
      data: { lastLoginAt: new Date() },
    });
  }

  async getCurrentAdmin(adminId: number): Promise<AdminWithoutPassword> {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    return admin;
  }

  async changePassword(adminId: number, input: ChangePasswordInput): Promise<void> {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    const isCurrentPasswordValid = await comparePassword(input.currentPassword, admin.passwordHash);

    if (!isCurrentPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    await prisma.admin.update({
      where: { id: adminId },
      data: { passwordHash: newPasswordHash },
    });
  }

  async updateProfile(adminId: number, input: UpdateProfileInput): Promise<AdminWithoutPassword> {
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!existingAdmin) {
      throw ApiError.notFound('Admin not found');
    }

    if (input.phoneNumber && input.phoneNumber !== existingAdmin.phoneNumber) {
      const phoneExists = await prisma.admin.findFirst({
        where: {
          phoneNumber: input.phoneNumber,
          id: { not: adminId },
        },
      });

      if (phoneExists) {
        throw ApiError.conflict('Phone number already in use');
      }
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: {
        fullName: input.fullName || existingAdmin.fullName,
        phoneNumber: input.phoneNumber || existingAdmin.phoneNumber,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedAdmin;
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<{ resetToken: string }> {
    const admin = await prisma.admin.findUnique({
      where: { email: input.email },
    });

    // Prevent user enumeration — always return success if email not found
    if (!admin || admin.status === 'SUSPENDED') {
      // Still return a token-like response to prevent timing-based enumeration
      return { resetToken: generateResetToken() };
    }

    const resetToken = generateResetToken();
    const resetTokenHash = await hashPassword(resetToken);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpires: resetExpires,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL || 'https://moorhall.com'}/reset-password?token=${resetToken}`;
    const expiryTime = '1 hour';

    // Send reset email (fire-and-forget, don't block response on email failure)
    emailService.sendForgotPasswordEmail({
      to: admin.email,
      toName: admin.fullName,
      resetLink,
      expiryTime,
      requestTime: new Date().toISOString(),
    }).catch((err) => {
      console.error('[Auth] Failed to send forgot password email:', err.message);
    });

    return { resetToken };
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const admin = await prisma.admin.findFirst({
      where: {
        passwordResetExpires: { gte: new Date() },
      },
    });

    if (!admin) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    const isTokenValid = await comparePassword(input.resetToken, admin.passwordResetToken || '');

    if (!isTokenValid) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Send reset success confirmation email (fire-and-forget)
    const loginLink = `${process.env.FRONTEND_URL || 'https://moorhall.com'}/login`;

    emailService.sendResetSuccessEmail({
      to: admin.email,
      toName: admin.fullName,
      loginLink,
      timestamp: new Date().toISOString(),
    }).catch((err) => {
      console.error('[Auth] Failed to send reset success email:', err.message);
    });
  }

  async suspendAdmin(adminId: number, reason?: string): Promise<AdminWithoutPassword> {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: { status: 'SUSPENDED' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedAdmin;
  }

  async activateAdmin(adminId: number): Promise<AdminWithoutPassword> {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: { status: 'ACTIVE' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedAdmin;
  }

  private generateTokens(admin: {
    id: number;
    email: string;
    role: string;
    fullName: string;
    status: string;
    phoneNumber: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): TokenPair {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      throw ApiError.internal('JWT secrets not configured');
    }

    const payload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      fullName: admin.fullName,
      status: admin.status,
    };

    const accessToken = generateAccessToken(payload, jwtSecret, process.env.JWT_ACCESS_EXPIRY || '15m');
    const refreshToken = generateRefreshToken(payload, jwtRefreshSecret, process.env.JWT_REFRESH_EXPIRY || '7d');

    return { accessToken, refreshToken };
  }
}

export default new AuthService();
