const prefix = "[vornix]";

export const logger = {
  error: (message: string, error: unknown) => {
    console.error(
      `${prefix} ${message}`,
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error
    );
  },
  warn: (message: string) => {
    console.warn(`${prefix} ${message}`);
  },
  info: (message: string) => {
    console.info(`${prefix} ${message}`);
  },
};
