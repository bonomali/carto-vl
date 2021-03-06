import { BinaryOperation, NUMBERS_TO_NUMBER, DATES_TO_DATES } from './BinaryOperation';

import { checkMaxArguments } from '../utils';

/**
 * Compare if x is greater than or equal to y.
 *
 * This returns a numeric expression where 0 means `false` and 1 means `true`.
 *
 * @param {Number} x - Firt value of the comparison
 * @param {Number} y - Second value of the comparison
 * @return {Number} Result of the comparison: 0 or 1
 *
 * @example <caption>Compare two numbers to show only elements with price greater than or equal to 30.</caption>
 * const s = carto.expressions;
 * const viz = new carto.Viz({
 *   filter: s.gte(s.prop('price'), 30)
 * });
 *
 * @example <caption>Compare two numbers to show only elements with price greater than or equal to 30. (String)</caption>
 * const viz = new carto.Viz(`
 *   filter: $price >= 30  // Equivalent to gte($price, 30)
 * `);
 *
 * @memberof carto.expressions
 * @name gte
 * @function
 * @api
 */
export default class GreaterThanOrEqualTo extends BinaryOperation {
    constructor (a, b) {
        checkMaxArguments(arguments, 2);

        const signatureMethods = {
            1: (x, y) => x >= y ? 1 : 0 // NUMBERS_TO_NUMBER
        };

        const glsl = (x, y) => `(${x}>=${y}? 1.:0.)`;

        super(a, b, signatureMethods, glsl);
        this.allowedSignature = NUMBERS_TO_NUMBER | DATES_TO_DATES;
    }
}
