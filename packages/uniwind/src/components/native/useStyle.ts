/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { useEffect, useMemo, useReducer } from 'react'
import { UniwindStore } from '../../core/native'
import { ComponentState, RNStyle } from '../../core/types'
import { StyleDependency } from '../../types'

const emptyState = { styles: {} as RNStyle, dependencies: [] as Array<StyleDependency> }

export const useStyle = (className?: string, state?: ComponentState) => {
    const [_, rerender] = useReducer(() => ({}), {})
    const styleState = useMemo(
        () => className ? UniwindStore.getStyles(className, state) : emptyState,
        [className, _, state?.isDisabled, state?.isFocused, state?.isPressed],
    )

    useEffect(() => {
        if (styleState.dependencies.length > 0) {
            const dispose = UniwindStore.subscribe(() => rerender(), styleState.dependencies)

            return dispose
        }
    }, [styleState])

    return styleState.styles
}
