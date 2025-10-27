import { useEffect, useState } from 'react'
import { ThemeName, Uniwind } from '../core'
import { CSSListener } from '../core/web'

export const useUniwind = () => {
    const [theme, setTheme] = useState(Uniwind.currentTheme)
    const [hasAdaptiveThemes, setHasAdaptiveThemes] = useState(Uniwind.hasAdaptiveThemes)

    useEffect(() => {
        const dispose = CSSListener.addThemeListener(() => {
            setTheme(Uniwind.currentTheme)
            setHasAdaptiveThemes(Uniwind.hasAdaptiveThemes)
        })

        return () => {
            dispose()
        }
    }, [])

    return {
        theme: theme as ThemeName,
        hasAdaptiveThemes,
    }
}
