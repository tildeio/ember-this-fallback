import { type SourceSpan } from '@glimmer/syntax';
import _debug from 'debug';
import {
  createLogger as _createLogger,
  format,
  transports,
  type Logform,
} from 'winston';
import Transport from 'winston-transport';

export interface Logger {
  debug: LeveledLogMethod;
  warn: LeveledLogMethod;
  error: LeveledLogMethod;
}

type RawMessage = string | string[];

interface LeveledLogMethod {
  (message: RawMessage, ...meta: unknown[]): void;
  (infoObject: Partial<LogInfo>): void;
}

interface LogInfo {
  message: RawMessage;
  loc?: SourceSpan;
}

type FormattedLogInfo = Omit<Logform.TransformableInfo, 'message' | 'level'> &
  Omit<LogInfo, 'message'> & {
    message: string;
    level: string;
    label: string;
    timestamp: string;
  };

export function noopLogger(): Logger {
  return {
    debug: noop,
    warn: noop,
    error: noop,
  };
}

export default function createLogger(namespace: string, label: string): Logger {
  const debug = _debug(namespace);

  class DebugTransport extends Transport {
    public override log(info: FormattedLogInfo, next: () => void): void {
      debug(info[Symbol.for('message')]);
      next();
    }
  }

  return _createLogger({
    level: 'debug',
    transports: [
      new transports.File({
        level: 'info',
        filename: `${namespace}.log`,
        format: format.combine(
          joinLines(),
          format.label({ label }),
          format.timestamp(),
          format.splat(),
          logFormatter
        ),
      }),
      new DebugTransport({
        level: 'debug',
        format: format.combine(
          joinLines(),
          format.label({ label }),
          format.timestamp(),
          format.splat(),
          debugFormatter
        ),
      }),
    ],
  });
}

const joinLines = format((info) => {
  if (
    Array.isArray(info.message) &&
    info.message.every((m): m is string => typeof m === 'string')
  ) {
    info.message = joinLogLines(info.message);
  }
  return info;
});

const logFormatter = format.printf((info) => {
  const { level, label, timestamp, message, loc } = info as FormattedLogInfo;
  return `${timestamp} [${level}] ${concatMessage(label, message, loc)}`;
});

const debugFormatter = format.printf((info) => {
  const { label, message } = info as FormattedLogInfo;
  return concatMessage(label, message);
});

function concatMessage(
  label: string,
  message: string,
  loc?: SourceSpan | undefined
): string {
  if (loc) {
    const start = loc.startPosition;
    label += `:${start.line}:${start.column + 1}`;
  }
  return joinLogLines([label, message]);
}

function joinLogLines(lines: string[]): string {
  return lines.join('\n\t');
}

function noop(): void {}
