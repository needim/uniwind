/* eslint-disable max-depth */
import { Dimensions, Platform } from 'react-native'
import { Orientation, StyleDependency } from '../../types'
import { ComponentState, GenerateStyleSheetsCallback, RNStyle, Style, StyleSheets } from '../types'
import { cloneWithAccessors } from './native-utils'
import { parseBoxShadow, parseFontVariant, parseTransformsMutation, resolveGradient } from './parsers'
import { UniwindRuntime } from './runtime'

type StylesResult = {
    styles: RNStyle
    dependencies: Array<StyleDependency>
}

class UniwindStoreBuilder {
    runtime = UniwindRuntime
    vars = {} as Record<string, unknown>
    private stylesheet = {} as StyleSheets
    private listeners = {
        [StyleDependency.ColorScheme]: new Set<() => void>(),
        [StyleDependency.Theme]: new Set<() => void>(),
        [StyleDependency.Dimensions]: new Set<() => void>(),
        [StyleDependency.Orientation]: new Set<() => void>(),
        [StyleDependency.Insets]: new Set<() => void>(),
        [StyleDependency.FontScale]: new Set<() => void>(),
        [StyleDependency.Rtl]: new Set<() => void>(),
    }
    private cache = new Map<string, StylesResult>()
    private generateStyleSheetCallbackResult: ReturnType<GenerateStyleSheetsCallback> | null = null

    subscribe(onStoreChange: () => void, dependencies: Array<StyleDependency>) {
        dependencies.forEach(dep => {
            this.listeners[dep].add(onStoreChange)
        })

        return () => {
            dependencies.forEach(dep => {
                this.listeners[dep].delete(onStoreChange)
            })
        }
    }

    getStyles(className?: string, state?: ComponentState): StylesResult {
        if (className === undefined || className === '') {
            return {
                styles: {},
                dependencies: [],
            }
        }

        const cacheKey = `${className}${state?.isDisabled ?? false}${state?.isFocused ?? false}${state?.isPressed ?? false}`

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!
        }

        const result = this.resolveStyles(className, state)

        this.cache.set(cacheKey, result)

        const cacheReset = () => {
            this.cache.delete(cacheKey)
            result.dependencies.forEach(dep => this.listeners[dep].delete(cacheReset))
        }

        this.subscribe(cacheReset, result.dependencies)

        return result
    }

    reinit = (generateStyleSheetCallback?: GenerateStyleSheetsCallback) => {
        const config = generateStyleSheetCallback?.(this.runtime) ?? this.generateStyleSheetCallbackResult

        if (!config) {
            return
        }

        const { scopedVars, stylesheet, vars } = config

        this.generateStyleSheetCallbackResult = config
        this.stylesheet = stylesheet
        this.vars = vars

        const themeVars = scopedVars[`__uniwind-theme-${this.runtime.currentThemeName}`]
        const platformVars = scopedVars[`__uniwind-platform-${Platform.OS}`]

        if (themeVars) {
            Object.defineProperties(this.vars, Object.getOwnPropertyDescriptors(themeVars))
        }

        if (platformVars) {
            Object.defineProperties(this.vars, Object.getOwnPropertyDescriptors(platformVars))
        }
    }

    notifyListeners = (dependencies: Array<StyleDependency>) => {
        dependencies.forEach(dep => this.listeners[dep].forEach(listener => listener()))
    }

    private resolveStyles(classNames: string, state?: ComponentState) {
        const result = {} as Record<string, any>
        let vars = this.vars
        const dependencies = [] as Array<StyleDependency>
        const bestBreakpoints = new Map<string, Style>()

        for (const className of classNames.split(' ')) {
            if (!(className in this.stylesheet)) {
                continue
            }

            for (const style of this.stylesheet[className] as Array<Style>) {
                dependencies.push(...style.dependencies)

                if (
                    style.minWidth > this.runtime.screen.width
                    || style.maxWidth < this.runtime.screen.height
                    || (style.theme !== null && this.runtime.currentThemeName !== style.theme)
                    || (style.orientation !== null && this.runtime.orientation !== style.orientation)
                    || (style.rtl !== null && this.runtime.rtl !== style.rtl)
                    || (style.active !== null && state?.isPressed !== style.active)
                    || (style.focus !== null && state?.isFocused !== style.focus)
                    || (style.disabled !== null && state?.isDisabled !== style.disabled)
                ) {
                    continue
                }

                for (const [property, valueGetter] of style.entries) {
                    const previousBest = bestBreakpoints.get(property)

                    if (
                        previousBest
                        && (
                            previousBest.minWidth > style.minWidth
                            || previousBest.complexity > style.complexity
                            || previousBest.importantProperties.includes(property)
                        )
                    ) {
                        continue
                    }

                    if (property[0] === '-') {
                        // Clone vars object if we are adding inline variables
                        if (vars === this.vars) {
                            vars = cloneWithAccessors(this.vars)
                        }

                        Object.defineProperty(vars, property, {
                            configurable: true,
                            enumerable: true,
                            get: valueGetter,
                        })
                    } else {
                        Object.defineProperty(result, property, {
                            configurable: true,
                            enumerable: true,
                            get: () => valueGetter.call(vars),
                        })
                    }

                    bestBreakpoints.set(property, style)
                }
            }
        }

        if (result.lineHeight !== undefined && result.lineHeight < 6) {
            Object.defineProperty(result, 'lineHeight', {
                value: result.fontSize * result.lineHeight,
                configurable: true,
                enumerable: true,
            })
        }

        if (result.boxShadow !== undefined) {
            Object.defineProperty(result, 'boxShadow', {
                value: parseBoxShadow(result.boxShadow),
                configurable: true,
                enumerable: true,
            })
        }

        if (result.visibility === 'hidden') {
            Object.defineProperty(result, 'display', {
                value: 'none',
                configurable: true,
                enumerable: true,
            })
        }

        if (
            result.borderStyle !== undefined && result.borderColor === undefined
        ) {
            Object.defineProperty(result, 'borderColor', {
                value: '#000000',
                configurable: true,
                enumerable: true,
            })
        }

        if (result.fontVariant !== undefined) {
            Object.defineProperty(result, 'fontVariant', {
                value: parseFontVariant(result.fontVariant),
                configurable: true,
                enumerable: true,
            })
        }

        parseTransformsMutation(result)

        if (result.experimental_backgroundImage !== undefined) {
            Object.defineProperty(result, 'experimental_backgroundImage', {
                value: resolveGradient(result.experimental_backgroundImage),
                configurable: true,
                enumerable: true,
            })
        }

        return {
            styles: { ...result } as RNStyle,
            dependencies: Array.from(new Set(dependencies)),
        }
    }
}

export const UniwindStore = new UniwindStoreBuilder()

Dimensions.addEventListener('change', ({ window }) => {
    const newOrientation = window.width > window.height ? Orientation.Landscape : Orientation.Portrait
    const orientationChanged = UniwindStore.runtime.orientation !== newOrientation

    UniwindStore.runtime.screen = {
        width: window.width,
        height: window.height,
    }
    UniwindStore.runtime.orientation = newOrientation
    UniwindStore.notifyListeners([
        ...orientationChanged ? [StyleDependency.Orientation] : [],
        StyleDependency.Dimensions,
    ])
})
