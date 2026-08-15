import Joi from 'joi';

const createOrganizationValidator = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Organization name is required',
    'string.min': 'Organization name must be at least 2 characters long',
    'string.max': 'Organization name cannot exceed 100 characters',
    'any.required': 'Organization name is required',
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description cannot exceed 500 characters',
  }),
});

export { createOrganizationValidator };
