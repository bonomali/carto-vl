import ClusterAggregation from './ClusterAggregation';
import { checkMaxArguments } from '../../utils';
/**
 * Aggregate using the sum. This operation disables the access to the property
 * except within other cluster aggregate functions.
 *
 * Note: `clusterSum` can only be created by {@link carto.expressions.prop|carto.expressions.prop}, not other expressions.
 *
 * @param {Number} property - Column of the table to be aggregated
 * @return {Number} Aggregated column
 *
 * @example <caption>Use cluster sum of the population as width.</caption>
 * const s = carto.expressions;
 * const viz = new carto.Viz({
 *   width: s.clusterSum(s.prop('population'))
 * });
 *
 * @example <caption>Use cluster sum of the population as width. (String)</caption>
 * const viz = new carto.Viz(`
 *   width: clusterSum($population)
 * `);
 *
 * @memberof carto.expressions
 * @name clusterSum
 * @function
 * @api
 */
export default class ClusterSum extends ClusterAggregation {
    constructor (property) {
        checkMaxArguments(arguments, 1, 'clusterSum');
        super({ property, expressionName: 'clusterSum', aggName: 'sum', aggType: 'number' });
    }
}
