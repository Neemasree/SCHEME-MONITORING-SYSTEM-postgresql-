const { z } = require('zod');

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number');

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
}).strict();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password,
}).strict();

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password,
  role: z.enum(['admin', 'district_officer', 'field_officer', 'beneficiary']),
  district: z.string().trim().max(100).optional().nullable(),
}).strict().superRefine((value, context) => {
  if (['district_officer', 'field_officer'].includes(value.role) && !value.district?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['district'],
      message: 'A district is required for officer accounts',
    });
  }
});

const schemeSchema = z.object({
  schemeName: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  budget: z.union([z.string(), z.number().finite()]).optional().nullable(),
  district: z.string().trim().max(100).optional().nullable(),
  startDate: z.string().date().optional().nullable(),
  endDate: z.string().date().optional().nullable(),
  status: z.enum(['Active', 'Inactive', 'Archived']).optional(),
}).strict().superRefine((value, context) => {
  if (value.startDate && value.endDate && value.endDate < value.startDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'End date must be on or after start date',
    });
  }
});

const applicationSchema = z.object({
  schemeId: z.coerce.number().int().positive(),
}).strict();

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  remark: z.string().trim().max(2000).optional(),
}).strict().superRefine((value, context) => {
  if (value.action === 'reject' && !value.remark) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['remark'],
      message: 'A rejection remark is required',
    });
  }
});

module.exports = {
  loginSchema,
  registerSchema,
  createUserSchema,
  schemeSchema,
  applicationSchema,
  approvalSchema,
};
