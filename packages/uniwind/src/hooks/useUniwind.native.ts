import { useEffect, useState } from 'react'
import { Uniwind } from '../core'
import { UniwindStore } from '../core/native'
import { StyleDependency } from '../types'

export const useUniwind = () => {
    const [theme, setTheme] = useState(Uniwind.currentTheme)
    const [hasAdaptiveThemes, setHasAdaptiveThemes] = useState(Uniwind.hasAdaptiveThemes)

    useEffect(() => {
        const dispose = UniwindStore.subscribe(() => {
            setTheme(Uniwind.currentTheme)
            setHasAdaptiveThemes(Uniwind.hasAdaptiveThemes)
        }, [StyleDependency.Theme])

        return () => {
            dispose()
        }
    }, [])

    return {
        theme,
        hasAdaptiveThemes,
    }
}
