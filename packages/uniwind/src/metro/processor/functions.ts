import { CalcFor_DimensionPercentageFor_LengthValue, CalcFor_Length, CssColor, Function as FunctionType } from 'lightningcss'
import { Logger } from '../logger'
import { percentageToFloat, pipe } from '../utils'
import type { ProcessorBuilder } from './processor'

export class Functions {
    private readonly logger = new Logger('Functions')

    constructor(private readonly Processor: ProcessorBuilder) {}

    processCalc(calc: CalcFor_DimensionPercentageFor_LengthValue | CalcFor_Length): string {
        switch (calc.type) {
            case 'sum': {
                const sum = calc.value.map(x => this.processCalc(x)).join(' + ')

                return this.tryEval(sum)
            }
            case 'value':
                return this.Processor.CSS.processValue(calc.value)
            case 'function':
                return this.Processor.CSS.processValue(calc.value)
            case 'number':
                return String(calc.value)
            default:
                this.logger.error(`Unsupported calc type - ${calc.type}`)

                return ''
        }
    }

    processFunction(fn: string | FunctionType) {
        if (typeof fn !== 'object') {
            this.logger.error(`Unsupported function - ${fn}`)

            return fn
        }

        if (fn.name === 'calc') {
            const calc = this.Processor.CSS.processValue(fn.arguments)

            return pipe(calc)(
                String,
                x => this.Processor.Functions.tryEval(x),
            )
        }

        if (fn.name === 'cubic-bezier') {
            const cubicArguments = pipe(this.Processor.CSS.processValue(fn.arguments))(
                String,
                x => x.replace(/,\s/g, ','),
            )

            return `rt.cubicBezier(${cubicArguments})`
        }

        if (fn.name === 'max') {
            return `Math.max( ${this.Processor.CSS.processValue(fn.arguments)} )`
        }

        if (fn.name === 'linear-gradient') {
            return this.Processor.CSS.processValue(fn.arguments)
        }

        if (fn.name === 'color-mix') {
            return this.processColorMix(fn)
        }

        if (
            [
                'rgb',
                'oklab',
                'oklch',
                'hsl',
                'hwb',
                'lab',
                'lch',
                'srgb',
            ].includes(fn.name)
        ) {
            const color = `${fn.name}(${this.Processor.CSS.processValue(fn.arguments)})`

            return this.Processor.Color.processColor(color as CssColor)
        }

        if (
            [
                'blur',
                'brightness',
                'contrast',
                'grayscale',
                'hue-rotate',
                'invert',
                'opacity',
                'saturate',
                'sepia',
                'conic-gradient',
                'radial-gradient',
            ].includes(fn.name)
        ) {
            // Not supported by RN
            return '""'
        }

        if (['skewX', 'skewY'].includes(fn.name)) {
            return `${fn.name}(${this.Processor.CSS.processValue(fn.arguments)})`
        }

        if (fn.name === 'hairlineWidth') {
            return 'rt.hairlineWidth'
        }

        if (fn.name === 'pixelRatio') {
            return `rt.pixelRatio( ${this.Processor.CSS.processValue(fn.arguments)} )`
        }

        if (fn.name === 'fontScale') {
            return `rt.fontScale( ${this.Processor.CSS.processValue(fn.arguments)} )`
        }

        this.logger.error(`Unsupported function - ${fn.name}`)

        return fn.name
    }

    processMathFunction(
        name: string,
        value:
            | Array<CalcFor_DimensionPercentageFor_LengthValue>
            | Array<CalcFor_Length>
            | CalcFor_DimensionPercentageFor_LengthValue
            | CalcFor_Length,
    ) {
        if (!Array.isArray(value)) {
            return `Math.${name} ( ${this.processCalc(value)} )`
        }

        const values = value.map(x => this.processCalc(x)).join(' , ')

        return `Math.${name}( ${values} )`
    }

    private tryEval(value: string) {
        // Match units like %, deg, rad, grad, turn that are not preceded by letters or hyphens
        const units = Array.from(value.match(/(?<![A-Za-z-])(?:%|deg|rad|grad|turn)(?=\s|$)/g) ?? [])

        if (units.length === 0) {
            return value
        }

        if (new Set(units).size !== 1) {
            this.logger.error(`Invalid calc, you can't mix multiple units`)

            return value
        }

        const unit = units.at(0) ?? ''

        try {
            const numericValue = value.replace(new RegExp(unit, 'g'), '')

            // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
            return new Function(`return ${numericValue} + '${unit}'`)()
        } catch {
            this.logger.error(`Invalid calc ${value}`)

            return value
        }
    }

    private processColorMix(fn: FunctionType) {
        const tokens = pipe(this.Processor.CSS.processValue(fn.arguments))(
            String,
            x => x.replace(/\](?!\s*[+-/*])(?!\s)/g, '] '),
            x => x.replace(/,/g, ''),
            x => x.split(' '),
        )

        const color = tokens.find(token => token.startsWith('#') || token.startsWith('this[`--color-'))
        const percentage = percentageToFloat(tokens.find(token => token.endsWith('%')) ?? '50%')
        const mixColor = tokens.reverse().find(token => token.startsWith('#') || token.startsWith('this[`--color-'))

        return [
            'rt.colorMix( ',
            color,
            ', ',
            mixColor,
            ', ',
            percentage,
            ' )',
        ].join('')
    }
}
