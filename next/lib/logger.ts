import { isAppError } from "@/lib/errors/app-error";

export interface LoggerInstance {
  warn: (context: string, message: string, metadata?: unknown) => void;
  error: (context: string, error: unknown, metadata?: unknown) => void;
  info: (context: string, message: string, metadata?: unknown) => void;
  debug: (context: string, message: string, metadata?: unknown) => void;
}

const isLocal = process.env.ENV_NAME === "local";
const isDev = process.env.NODE_ENV === "development";

const shouldShowStack = isLocal || isDev;

/**
 * undefined を除去してログ引数を組み立てる
 */
const buildArgs = (...args: unknown[]) => args.filter((v) => v !== undefined);

/**
 * 出力（ここを差し替えれば外部ロガーにも対応できる）
 */
const write = {
  error: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  info: (...args: unknown[]) => console.log(...args),
  debug: (...args: unknown[]) => console.debug(...args),
};

// 色（サーバーだけ）
const color = (code: string) => (isLocal || isDev ? code : ""); // 本番環境では色コードを出さない
const red = color("\x1b[31m");
const yellow = color("\x1b[33m");
const cyan = color("\x1b[36m");
const grey = color("\x1b[90m");
const reset = color("\x1b[0m");

export const logger: LoggerInstance = {
  error(context, error, metadata) {
    if (isAppError(error)) {
      const stack = shouldShowStack ? `\n${error.stack}` : undefined;
      const args = buildArgs(
        `${red}[${context}][error][${error.code ?? error.name}]${reset} ${error.message}:`,
        error.details,
        metadata,
        stack
      );

      write.error(...args);
      return;
    }

    if (error instanceof Error) {
      const { stack: _stack, name, message, ...rest } = error;
      const stack = shouldShowStack ? `\n${_stack}` : undefined;
      const args = buildArgs(
        `${red}[${context}][error][${name}]${reset} ${message}:`,
        metadata,
        rest,
        stack
      );

      write.error(...args);
      return;
    }

    const args = buildArgs(
      `${red}[${context}][error]${reset} ${String(error)}:`,
      metadata
    );

    write.error(...args);
  },

  warn(context, message, metadata) {
    write.warn(
      ...buildArgs(`${yellow}[${context}][warn]${reset} ${message}:`, metadata)
    );
  },

  info(context, message, metadata) {
    write.info(
      ...buildArgs(`${cyan}[${context}][info]${reset} ${message}:`, metadata)
    );
  },

  debug(context, message, metadata) {
    write.debug(
      ...buildArgs(`${grey}[${context}][debug]${reset} ${message}:`, metadata)
    );
  },
};
