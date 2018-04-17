import BaseExpression from './base';
import * as schema from '../../schema';
import Property from './property';
import { checkInstance, checkType } from './utils';

/**
 * Aggregate using the average value. This operation disables the access to the property
 *
 * @param {carto.expressions.Property} property - Column of the table to be aggregated
 * @return {carto.expressions.Property} Aggregated column
 *
 * @example
 * const s = carto.expressions;
 * const $population = s.prop('population');
 * const viz = new carto.Viz({
 *   width: s.avg($population);
 * });
 *
 * @memberof carto.expressions
 * @function
 * @name avg
 * @api
 */
export const Avg = genAggregationOp('avg', 'float');

/**
 * Aggregate using the maximum value. This operation disables the access to the property
 *
 * @param {carto.expressions.Property} property - Column of the table to be aggregated
 * @return {carto.expressions.Property} Aggregated column
 *
 * @example
 * const s = carto.expressions;
 * const $population = s.prop('population');
 * const viz = new carto.Viz({
 *   width: s.max($population);
 * });
 *
 * @memberof carto.expressions
 * @function
 * @name max
 * @api
 */
export const Max = genAggregationOp('max', 'float');

/**
 * Aggregate using the minimum value. This operation disables the access to the property
 *
 * @param {carto.expressions.Property} property - Column of the table to be aggregated
 * @return {carto.expressions.Property} Aggregated column
 *
 * @example
 * const s = carto.expressions;
 * const $population = s.prop('population');
 * const viz = new carto.Viz({
 *   width: s.min($population);
 * });
 *
 * @memberof carto.expressions
 * @function
 * @name min
 * @api
 */
export const Min = genAggregationOp('min', 'float');

/**
 * Aggregate using the maximum value. This operation disables the access to the property
 *
 * @param {carto.expressions.Property} property - Column of the table to be aggregated
 * @return {carto.expressions.Property} Aggregated column
 *
 * @example
 * const s = carto.expressions;
 * const $population = s.prop('population');
 * const viz = new carto.Viz({
 *   width: s.sum($population);
 * });
 *
 * @memberof carto.expressions
 * @function
 * @name sum
 * @api
 */
export const Sum = genAggregationOp('sum', 'float');

/**
 * Aggregate using the maximum value. This operation disables the access to the property
 *
 * @param {carto.expressions.Property} property - Column of the table to be aggregated
 * @return {carto.expressions.Property} Aggregated column
 *
 * @example
 * const s = carto.expressions;
 * const $population = s.prop('population');
 * const viz = new carto.Viz({
 *   width: s.mode($population);
 * });
 *
 * @memberof carto.expressions
 * @function
 * @name mode
 * @api
 */
export const Mode = genAggregationOp('mode', 'category');

function genAggregationOp(aggName, aggType) {
    return class AggregationOperation extends BaseExpression {
        constructor(property) {
            checkInstance(aggName, 'property', 0, Property, property);
            super({ property });
            this._aggName = aggName;
            this.type = aggType;
        }
        get name() {
            return this.property.name;
        }
        get aggName() {
            return this._aggName;
        }
        get numCategories() {
            return this.property.numCategories;
        }
        eval(feature) {
            return feature[schema.column.aggColumn(this.property.name, aggName)];
        }
        //Override super methods, we don't want to let the property use the raw column, we must use the agg suffixed one
        _compile(metadata) {
            super._compile(metadata);
            checkType(aggName, 'property', 0, aggType, this.property);
        }
        _applyToShaderSource(getGLSLforProperty) {
            return {
                preface: '',
                inline: `${getGLSLforProperty(schema.column.aggColumn(this.property.name, aggName))}`
            };
        }
        _postShaderCompile() { }
        _getMinimumNeededSchema() {
            return {
                columns: [
                    schema.column.aggColumn(this.property.name, aggName)
                ]
            };
        }
    };
}
