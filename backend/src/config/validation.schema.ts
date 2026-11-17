import * as Joi from 'joi';

/** Checked at startup. The app refuses to boot if a required variable is missing or malformed. */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().required(),

  // Chapa (payments)
  // CHASECK_TEST-… (test mode) or CHASECK-… (live). Checked again when a payment starts.
  CHAPA_SECRET_KEY: Joi.string().required(),
  CHAPA_CALLBACK_URL: Joi.string().uri().allow('').default(''),
  CHAPA_WEBHOOK_SECRET: Joi.string().allow('').default(''),
  CHAPA_BASE_URL: Joi.string().uri().allow('').default(''),

  FRONTEND_URL: Joi.string().uri().required(),

  // First admin account, only used when the database has no users yet.
  ADMIN_BOOTSTRAP_PASSWORD: Joi.string().min(12).allow('').default(''),
}).required();
