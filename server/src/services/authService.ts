import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUserDocument } from '../models/User';
import ApiError from '../utils/ApiError';
import { TJwtPayload } from '../types';
import { BCRYPT_ROUNDS, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../constants/auth';

interface TTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TAuthResult {
  user: IUserDocument;
  accessToken: string;
  refreshToken: string;
}

const generateTokens = (userId: string, email: string): TTokenPair => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret) throw new ApiError(500, 'JWT_SECRET is not configured');
  if (!jwtRefreshSecret) throw new ApiError(500, 'JWT_REFRESH_SECRET is not configured');

  const payload: TJwtPayload = { userId, email };

  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, jwtRefreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });

  return { accessToken, refreshToken };
};

export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<TAuthResult> => {
  const existing = await User.findByEmail(email);
  if (existing) throw new ApiError(409, 'Email already in use');

  const user = new User({ name, email, passwordHash: password });
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email);

  user.refreshToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
  await user.save();

  return { user, accessToken, refreshToken };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<TAuthResult> => {
  const user = await User.findByEmail(email);
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email);

  user.refreshToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
  await user.save();

  return { user, accessToken, refreshToken };
};

export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtRefreshSecret) throw new ApiError(500, 'JWT_REFRESH_SECRET is not configured');

  let payload: TJwtPayload;
  try {
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret);
    if (typeof decoded === 'string') throw new ApiError(401, 'Invalid refresh token');
    payload = decoded as TJwtPayload;
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.refreshToken) throw new ApiError(401, 'Invalid refresh token');

  const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isValid) throw new ApiError(401, 'Invalid refresh token');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new ApiError(500, 'JWT_SECRET is not configured');

  const accessToken = jwt.sign({ userId: payload.userId, email: payload.email } satisfies TJwtPayload, jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  return accessToken;
};

export const logoutUser = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};
