// Wraps an async route handler so thrown/rejected errors reach the
// central Express error handler without a try/catch in every route.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
