import { RequestHandler } from 'express';
import { Types } from 'mongoose';
import OrgMember from '../models/OrgMember';
import Organisation from '../models/Organisation';
import ApiError from '../utils/ApiError';
import { OrgRole, TJwtPayload } from '../types';

export const requireOrgRole = (roles: OrgRole[]): RequestHandler => {
  return async (req, _res, next): Promise<void> => {
    try {
      const { userId } = req.user as TJwtPayload;
      const { orgSlug } = req.params;

      const org = await Organisation.findOne({ slug: orgSlug, isActive: true });
      if (!org) {
        next(new ApiError(404, 'Organisation not found'));
        return;
      }

      const member = await OrgMember.findOne({
        organisation: org._id,
        user: new Types.ObjectId(userId),
        status: 'active',
      });

      if (!member) {
        next(new ApiError(403, 'You are not an active member of this organisation'));
        return;
      }

      if (!roles.includes(member.role)) {
        next(new ApiError(403, 'You do not have permission to perform this action'));
        return;
      }

      req.orgMember = member;
      next();
    } catch (error) {
      next(error);
    }
  };
};
