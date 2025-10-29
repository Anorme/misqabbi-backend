export const formatResponse = (payload = {}) => {
  const {
    success = true,
    message = "",
    data = null,
    error = null,
    ...rest
  } = payload;
  return {
    success,
    message,
    ...(data && { data }),
    ...(error && { error }),
    ...rest,
  };
};
