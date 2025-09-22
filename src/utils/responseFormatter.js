export const formatResponse = ({
  success = true,
  message = "",
  data = null,
  error = null,
}) => {
  return {
    success,
    message,
    ...(data && { data }),
    ...(error && { error }),
  };
};
