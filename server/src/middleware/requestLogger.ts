import morgan from 'morgan';

/**
 * Request logger using morgan.
 * - Development: concise colored output
 * - Production: Apache combined format for log aggregation
 */
const requestLogger = morgan(
  process.env.NODE_ENV === 'development' ? 'dev' : 'combined'
);

export default requestLogger;
