/*
 * Copyright (c) 2026 AOR Conseil. All rights reserved.
 * Proprietary and confidential.
 * Licensed under the AOR Commercial License.
 *
 * Use, reproduction, modification, distribution, or disclosure of this
 * source code, in whole or in part, is prohibited except under a valid
 * written commercial agreement with AOR Conseil.
 *
 * See LICENSE.md for the full license terms.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

export interface Logger {
    readonly level: LogLevel;
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    child(scope: string): Logger;
}

export interface CreateConsoleLoggerOptions {
    /** Niveau minimal affiché (par défaut : variable d'environnement ou déduction via NODE_ENV). */
    level?: LogLevel;
    /** Préfixe affiché après le niveau, ex. `Bootstrap` ou `Nest`. */
    context?: string;
    /**
     * Enables or disables ANSI colors. Default: auto from `NO_COLOR`, TTY detection, and `FORCE_COLOR`.
     */
    color?: boolean;
}

function normalizeLevel(input: string | undefined): LogLevel | null {
    if (!input) {
        return null;
    }
    const lowered = input.trim().toLowerCase();
    if (lowered === 'debug' || lowered === 'info' || lowered === 'warn' || lowered === 'error') {
        return lowered;
    }
    return null;
}

/**
 * Lit `LOG_LEVEL` si présente, sinon `info` en production et `debug` ailleurs.
 */
export function resolveLogLevelFromEnv(): LogLevel {
    const fromEnv = normalizeLevel(typeof process !== 'undefined' ? process.env.LOG_LEVEL : undefined);
    if (fromEnv) {
        return fromEnv;
    }
    const prod = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
    return prod ? 'info' : 'debug';
}

function safeStringify(meta: Record<string, unknown>): string {
    try {
        return JSON.stringify(meta);
    } catch {
        return '{}';
    }
}

/** Follows https://no-color.org/ and common `FORCE_COLOR` semantics. */
function resolveUseColor(colorOption: boolean | undefined): boolean {
    if (typeof process === 'undefined') {
        return false;
    }
    if (colorOption === false) {
        return false;
    }
    if (colorOption === true) {
        return true;
    }
    if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '') {
        return false;
    }
    const force = process.env.FORCE_COLOR;
    if (force === '0' || force === 'false') {
        return false;
    }
    if (force === '1' || force === 'true' || force === '2' || force === '3') {
        return true;
    }
    return process.stdout.isTTY === true;
}

const ansi = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
} as const;

const LEVEL_STYLE: Record<LogLevel, string> = {
    debug: `${ansi.bold}${ansi.cyan}`,
    info: `${ansi.bold}${ansi.green}`,
    warn: `${ansi.bold}${ansi.yellow}`,
    error: `${ansi.bold}${ansi.red}`,
};

function formatLogLine(
    useColor: boolean,
    messageLevel: LogLevel,
    timestamp: string,
    context: string,
    message: string,
    meta?: Record<string, unknown>
): string {
    const levelLabel = messageLevel.toUpperCase();
    const ctxPart = context ? ` [${context}]` : '';
    const metaPart = meta && Object.keys(meta).length > 0 ? ` ${safeStringify(meta)}` : '';

    if (!useColor) {
        return `${timestamp} ${levelLabel}${ctxPart} ${message}${metaPart}`;
    }

    const timeColored = `${ansi.dim}${ansi.gray}${timestamp}${ansi.reset}`;
    const levelColored = `${LEVEL_STYLE[messageLevel]}${levelLabel}${ansi.reset}`;
    const ctxColored = ctxPart ? `${ansi.dim}${ansi.magenta}${ctxPart}${ansi.reset}` : '';
    const metaColored = metaPart ? `${ansi.dim}${ansi.gray}${metaPart}${ansi.reset}` : '';

    return `${timeColored} ${levelColored}${ctxColored} ${message}${metaColored}`;
}

/**
 * Logger console structuré (horodatage ISO, niveau, contexte, métadonnées JSON optionnelles).
 */
export function createConsoleLogger(options: CreateConsoleLoggerOptions = {}): Logger {
    const level = options.level ?? resolveLogLevelFromEnv();
    const context = options.context ?? '';
    const useColor = resolveUseColor(options.color);

    const shouldLog = (messageLevel: LogLevel): boolean => LEVEL_ORDER[messageLevel] >= LEVEL_ORDER[level];

    const write = (messageLevel: LogLevel, message: string, meta?: Record<string, unknown>): void => {
        if (!shouldLog(messageLevel)) {
            return;
        }
        const timestamp = new Date().toISOString();
        const line = formatLogLine(useColor, messageLevel, timestamp, context, message, meta);
        switch (messageLevel) {
            case 'debug':
                console.debug(line);
                break;
            case 'info':
                console.info(line);
                break;
            case 'warn':
                console.warn(line);
                break;
            case 'error':
                console.error(line);
                break;
        }
    };

    const logger: Logger = {
        level,
        debug: (message, meta) => write('debug', message, meta),
        info: (message, meta) => write('info', message, meta),
        warn: (message, meta) => write('warn', message, meta),
        error: (message, meta) => write('error', message, meta),
        child: (scope: string) =>
            createConsoleLogger({
                level,
                context: context ? `${context}:${scope}` : scope,
                color: options.color,
            }),
    };

    return logger;
}
