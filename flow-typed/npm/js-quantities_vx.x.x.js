// flow-typed signature: 4491df0e2a3602e7ba40c62ad623790e
// flow-typed version: <<STUB>>/js-quantities_v1.7.5/flow_v0.134.0

/**
 * This is an autogenerated libdef stub for:
 *
 *   'js-quantities'
 *
 * Fill this stub out by replacing all the `any` types.
 *
 * Once filled out, we encourage you to share your work with the
 * community by sending a pull request to:
 * https://github.com/flowtype/flow-typed
 */

declare module 'js-quantities' {
  declare export class Qty {
    scalar: number;
    constructor(n: number | string, s?: string): Qty;
    isCompatible(q: Qty): boolean;
    to(q: Qty): Qty;
  }
}
