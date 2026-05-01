// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export const CUTOVER_STRATEGY_CONFIG_PORT_SYMBOL = Symbol('CUTOVER_STRATEGY_CONFIG_PORT_SYMBOL');

export interface ICutoverStrategyConfigPort {
    readonly strategy: 'legacy' | 'dual-run' | 'new-flow';
}
