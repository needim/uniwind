import { IconSymbol, IconSymbolName } from '@/components/icon-symbol'
import { UniwindThemes, useStoredTheme } from '@/utils/theme'
import { HeaderButton } from '@react-navigation/elements'
import { router } from 'expo-router'
import { ColorValue } from 'react-native'
import { useResolveClassNames, useUniwind } from 'uniwind'

const THEME_ICON_NAMES: Record<UniwindThemes, IconSymbolName> = {
    dark: 'moon.fill',
    light: 'sun.max.fill',
    sepia: 'camera.filters',
    system: 'circle.righthalf.filled',
}

const getIconColorForTheme = (
    theme: string,
    primaryColor: ColorValue | undefined,
): string => {
    const colorMap: Record<string, string> = {
        dark: 'white',
        light: 'black',
        sepia: primaryColor as string,
    }
    return colorMap[theme] ?? 'black'
}

export function ThemeSwitchButton() {
    const { storedTheme } = useStoredTheme()
    const { theme: uniwindTheme } = useUniwind()
    const primaryStyle = useResolveClassNames('bg-primary')

    const iconColor = getIconColorForTheme(
        uniwindTheme,
        primaryStyle.backgroundColor,
    )
    const iconName = THEME_ICON_NAMES[storedTheme as UniwindThemes] ?? THEME_ICON_NAMES.system

    return (
        <HeaderButton onPress={() => router.push('/theme-selector')}>
            <IconSymbol
                name={iconName}
                size={24}
                color={iconColor}
                animationSpec={{
                    speed: 4,
                    effect: {
                        type: 'bounce',
                    },
                }}
            />
        </HeaderButton>
    )
}
