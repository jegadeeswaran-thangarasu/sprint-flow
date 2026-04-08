import { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from '../services/authService';
import { TApiResponse, TJwtPayload } from '../types';
import { REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE_MAX_AGE } from '../constants/auth';

const isProduction = process.env.NODE_ENV === 'production';

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  });
};

interface TUserResponse {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    const { user, accessToken, refreshToken } = await registerUser(name, email, password);

    setRefreshTokenCookie(res, refreshToken);

    const userResponse: TUserResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    };

    const body: TApiResponse<{ user: TUserResponse; accessToken: string }> = {
      success: true,
      data: { user: userResponse, accessToken },
      message: 'Registration successful',
    };

    res.status(201).json(body);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const { user, accessToken, refreshToken } = await loginUser(email, password);

    setRefreshTokenCookie(res, refreshToken);

    const userResponse: TUserResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    };

    const body: TApiResponse<{ user: TUserResponse; accessToken: string }> = {
      success: true,
      data: { user: userResponse, accessToken },
      message: 'Login successful',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!token) {
      res.status(401).json({ success: false, data: null, message: 'No refresh token provided' });
      return;
    }

    const accessToken = await refreshAccessToken(token);

    const body: TApiResponse<{ accessToken: string }> = {
      success: true,
      data: { accessToken },
      message: 'Token refreshed',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user as TJwtPayload;
    await logoutUser(userId);

    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
    });

    const body: TApiResponse<null> = {
      success: true,
      data: null,
      message: 'Logged out successfully',
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};

export const getMe = (req: Request, res: Response): void => {
  const body: TApiResponse<{ user: TJwtPayload }> = {
    success: true,
    data: { user: req.user as TJwtPayload },
    message: 'Authenticated user',
  };

  res.status(200).json(body);
};
