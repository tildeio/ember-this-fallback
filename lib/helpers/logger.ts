import _debug from 'debug';
import {
  createLogger as _createLogger,
  format,
  transports,
  type Logform,
  type Logger,
} from 'winston';
import Transport from 'winston-transport';

type LogInfo = Logform.TransformableInfo & {
  label: string;
  timestamp: string;
};

const debug = _debug('ember-this-fallback-plugin');

class DebugTransport extends Transport {
  public override log(info: LogInfo, next: () => void): void {
    debug(info[Symbol.for('message')]);
    next();
  }
}

export default function createLogger(name: string, label: string): Logger {
  return _createLogger({
    level: 'debug',
    transports: [
      new transports.File({
        level: 'info',
        filename: `${name}-plugin.log`,
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

const logFormatter = format.printf(({ level, label, timestamp, message }) => {
  return `${String(timestamp)} [${level}] ${concatMessage(
    String(label),
    String(message)
  )}`;
});

const debugFormatter = format.printf(({ label, message }) => {
  return concatMessage(String(label), String(message));
});

function concatMessage(label: string, message: string): string {
  return joinLogLines([label, message]);
}

function joinLogLines(lines: string[]): string {
  return lines.join('\n\t');
}
