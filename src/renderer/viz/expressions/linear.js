import BaseExpression from './base';
import { checkExpression, implicitCast, checkType, checkMaxArguments, clamp } from './utils';
import { globalMin, globalMax } from '../expressions';
import { castTimeRange, msToDate } from '../../../utils/util';
import IdentityCodec from '../../../codecs/Identity';
import TimeZoneDate from '../../../utils/time/TimeZoneDate';
import { DEFAULT_SAMPLES, SORT_DESC } from './constants';
/**
* Linearly interpolates the value of a given input between a minimum and a maximum. If `min` and `max` are not defined they will
* default to `globalMin(input)` and `globalMax(input)`.
*
* @param {Number|Date} input - The input to be evaluated and interpolated, can be a numeric property or a date property
* @param {Number|Date} [min=globalMin(input)] - Numeric or date expression pointing to the lower limit
* @param {Number|Date} [max=globalMax(input)] - Numeric or date expression pointing to the higher limit
* @param {Number|Date} [max=globalMax(input)] - Numeric or date expression to set a timerange
* @param {Number} samples - Number of samples, which is 10 by default
* @return {Number|Date}
*
* @example <caption> Color by $speed using the CARTOColor Prism by assigning the first color in Prism to features with speeds of 10 or less, the last color in Prism to features with speeds of 100 or more and a interpolated value for the speeds in between.</caption>
* const s = carto.expressions;
* const viz = new carto.Viz({
*   color: s.ramp(s.linear(s.prop('speed'), 10, 100), s.palettes.PRISM)
* });
*
* @example <caption> Color by $speed using the CARTOColor Prism by assigning the first color in Prism to features with speeds of 10 or less, the last color in Prism to features with speeds of 100 or more and a interpolated value for the speeds in between. (String)</caption>
* const viz = new carto.Viz(`
*   color: ramp(linear($speed, 10, 100), PRISM)
* `);
*
* @example <caption> Set custom number of samples.</caption>
* const s = carto.expressions;
* const viz = new carto.Viz({
*   color: s.ramp(s.linear(s.prop('speed'), 10, 100, null, 10), s.palettes.PRISM)
* });
*
* @example <caption> Set custom number of samples. (String)</caption>
* const s = carto.expressions;
* const viz = new carto.Viz(`
*   color: ramp(linear($speed, 10, 100, null, 10), PRISM)
* `);
*
* @memberof carto.expressions
* @name linear
* @function
* @api
*/
export default class Linear extends BaseExpression {
    constructor (input, min, max, range, samples = DEFAULT_SAMPLES) {
        checkMaxArguments(arguments, 5, 'linear');

        input = implicitCast(input);

        if (min && !(min instanceof BaseExpression) && max === undefined && range === undefined) {
            range = min;
            min = undefined;
            max = undefined;
        }

        if (min === undefined && max === undefined) {
            min = globalMin(input);
            max = globalMax(input);
        }

        min = implicitCast(min);
        max = implicitCast(max);
        samples = implicitCast(samples);

        checkExpression('linear', 'input', 0, input);
        checkExpression('linear', 'min', 1, min);
        checkExpression('linear', 'max', 2, max);
        checkExpression('linear', 'samples', 4, samples);

        super({ input, min, max });
        this.type = 'number';
        this.samples = samples;

        // range mode is used only for timerange inputs:
        // * 'start' of property between full range (from start of min to end of max)
        // * 'end' of property between full range (from start of min to end of max)
        // * 'unit' (default) range mapped to 0:1
        this._rangeMode = range || 'unit';
    }

    // Given a linear value 0:1, convert it back to the input value
    // for TimeRange and Date inputs the result is an interpolated Date
    converse (value) {
        if (this.input.type === 'date') {
            const min = this.min.value.getTime();
            const max = this.max.value.getTime();
            return msToDate(value * (max - min) + min);
        } else if (this.input.type === 'timerange') {
            const minRange = castTimeRange(this.min.value);
            const maxRange = castTimeRange(this.max.value);
            if (minRange === undefined || maxRange === undefined) {
                // FIXME: it seems update event of layer can triggered
                // before metadata has been bounded.
                return null;
            }
            let min, max;
            switch (this._rangeMode) {
                case 'unit':
                    // timeRange here allows min, max to be simply iso strings
                    min = minRange.startValue;
                    max = maxRange.startValue;
                    break;
                case 'start':
                case 'end':
                    min = minRange.startValue;
                    max = maxRange.endValue;
                    break;
            }
            return TimeZoneDate.fromValue(value * (max - min) + min, minRange.timeZone);
        }
        const min = this.min.value;
        const max = this.max.value;
        return value * (max - min) + min;
    }

    // return min, max, but for time ranges they are returned as Dates
    limits () {
        let min, max;
        if (this.input.type === 'timerange') {
            switch (this._rangeMode) {
                case 'unit':
                    min = castTimeRange(this.min.value).startValue;
                    max = castTimeRange(this.max.value).startValue;
                    break;
                case 'start':
                case 'end':
                    min = castTimeRange(this.min.value).startValue;
                    max = castTimeRange(this.max.value).endValue;
                    break;
            }
        } else {
            min = this.min.value;
            max = this.max.value;
        }
        return [min, max];
    }

    get value () {
        return {
            min: this.min,
            max: this.max,
            input: this.input.value,
            range: this._rangeMode,
            samples: this.samples
        };
    }

    eval (feature) {
        if (this.input.type === 'timerange') {
            let inputIndex;
            switch (this._rangeMode) {
                case 'unit':
                    inputIndex = 0; // start
                    break;
                case 'start':
                    inputIndex = 0; // start
                    break;
                case 'end':
                    inputIndex = 1; // end
                    break;
            }
            const input = feature._dataframe.properties[this._metadata.decodedProperties(this.input.propertyName)[inputIndex]][feature._index];

            return (input - this._internalMin) / (this._internalMax - this._internalMin);
        }

        const input = this.input.eval(feature);
        const metadata = this._metadata;
        const codec = (metadata && this.input.propertyName)
            ? metadata.codec(this.input.propertyName)
            : new IdentityCodec();
        const min = codec.externalToInternal(metadata, this.min.eval(feature));
        const max = codec.externalToInternal(metadata, this.max.eval(feature));
        const value = codec.externalToInternal(metadata, input);
        return (value - min) / (max - min);
    }

    _bindMetadata (metadata) {
        super._bindMetadata(metadata);
        this._metadata = metadata;

        if (this.input.type === 'timerange') {
            let inputIndex, min, max;
            switch (this._rangeMode) {
                case 'unit':
                    // choose same side for all three:
                    inputIndex = 0; // start
                    min = metadata.codec(this.input.propertyName).externalToInternal(metadata, this.min.value)[inputIndex];
                    max = metadata.codec(this.input.propertyName).externalToInternal(metadata, this.max.value)[inputIndex];
                    // min in ms is castTimeRange(this.min.value).startValue;
                    // max in ms is castTimeRange(this.max.value).startValue;
                    break;
                case 'start':
                    inputIndex = 0; // start
                    min = metadata.codec(this.input.propertyName).externalToInternal(metadata, this.min.value)[0]; // start
                    max = metadata.codec(this.input.propertyName).externalToInternal(metadata, this.max.value)[1]; // end
                    // min in ms is castTimeRange(this.min.value).startValue;
                    // max in ms is castTimeRange(this.max.value).endValue;
                    break;
                case 'end':
                    inputIndex = 1; // end
                    min = metadata.codec(this.input.propertyName).externalToInternal(metadata, this.min.value)[0]; // start
                    max = metadata.codec(this.input.propertyName).externalToInternal(metadata, this.max.value)[1]; // end
                    // min in ms is castTimeRange(this.min.value).startValue;
                    // max in ms is castTimeRange(this.max.value).endValue;
                    break;
            }

            this._internalMin = min;
            this._internalMax = max;

            this.inlineMaker = (inline) => `((${inline.input[inputIndex]}-(${min.toFixed(20)}))/(${(max - min).toFixed(20)}))`;
        } else {
            checkType('linear', 'input', 0, ['number', 'date'], this.input);
            checkType('linear', 'min', 1, ['number', 'date'], this.min);
            checkType('linear', 'max', 2, ['number', 'date'], this.max);
            checkType('linear', 'samples', 4, ['number'], this.samples);
            // Should actually check:
            // checkType('linear', 'min', 1, this.input.type, this.min);
            // checkType('linear', 'max', 2, this.input.type, this.max);
            // but global aggregations are currently of type number even for dates

            const codec = this.input.propertyName && metadata.codec(this.input.propertyName);
            if (!codec || codec.isIdentity()) {
                // this permits using properties for the min/man expressions
                this.inlineMaker = (inline) => `((${inline.input}-${inline.min})/(${inline.max}-${inline.min}))`;
            } else {
                const smin = codec.externalToInternal(metadata, this.min.value);
                const smax = codec.externalToInternal(metadata, this.max.value);
                this.inlineMaker = (inline) => `((${inline.input}-(${smin.toFixed(20)}))/(${(smax - smin).toFixed(20)}))`;
            }
        }
    }

    getLegendData (options) {
        const min = this.min.value;
        const max = this.max.value;
        const name = this.toString();

        if (min === max) {
            return { min, max, name, data: [] };
        }

        const samples = options && options.samples
            ? options.samples
            : this.samples;

        const INC = 1 / (samples - 1);
        let data = [];

        for (let i = 0; data.length < samples; i += INC) {
            const value = clamp(i, 0, 1);
            const key = i * (max - min) + min;

            data.push({ key, value });
        }

        if (options.order && options.order === SORT_DESC) {
            data = data.sort((a, b) => b.key - a.key);
        }

        return { data, min, max, name };
    }
}
