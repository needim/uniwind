import { ThemeSwitchButton } from '@/components/theme-toggle-button'
import '@/globals.css'
import { getNativeColorScheme, getNavigationTheme, getStoredThemeSync, useStoredTheme } from '@/utils/theme'
import {
    ThemeProvider,
} from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Appearance, Platform } from 'react-native'
import { Uniwind, useUniwind } from 'uniwind'

// Set initial theme based on user preference
const initialTheme = getStoredThemeSync()
Uniwind.setTheme(initialTheme ?? 'system')

// Set React Native Appearance
Appearance.setColorScheme(getNativeColorScheme(initialTheme ?? 'system'))

const sections = [
    { name: 'Aspect Ratio', path: 'sections/aspect-ratio' },
    { name: 'Border', path: 'sections/border' },
    { name: 'Content Alignment', path: 'sections/content-alignment' },
    { name: 'Display', path: 'sections/display' },
    { name: 'Flex', path: 'sections/flex' },
    { name: 'Font', path: 'sections/font' },
    { name: 'Item Alignment', path: 'sections/item-alignment' },
    { name: 'Justify Content', path: 'sections/justify-content' },
    { name: 'Margin', path: 'sections/margin' },
    { name: 'Outline', path: 'sections/outline' },
    { name: 'Padding', path: 'sections/padding' },
    { name: 'Self Alignment', path: 'sections/self-alignment' },
    { name: 'Text Alignment', path: 'sections/text-alignment' },
    { name: 'Transform', path: 'sections/transform' },
]

export default function RootLayout() {
    const { theme: uniwindTheme } = useUniwind()
    const { storedTheme } = useStoredTheme()
    const navigationTheme = getNavigationTheme(uniwindTheme)

    return (
        <ThemeProvider value={navigationTheme}>
            <Stack
                screenOptions={{
                    headerBackButtonDisplayMode: 'minimal',
                    headerTransparent: true,
                    sheetGrabberVisible: true,
                    headerRight: () => <ThemeSwitchButton storedTheme={storedTheme} />,
                }}
            >
                <Stack.Screen name="index" options={{ title: 'Expo + Uniwind' }} />
                <Stack.Screen
                    name="theme-selector"
                    options={{
                        title: 'Theme',
                        presentation: 'formSheet',
                        sheetAllowedDetents: 'fitToContents',
                        headerRight: () => undefined,
                        contentStyle: {
                            backgroundColor: Platform.select({
                                ios: 'transparent',
                                android: navigationTheme.colors.background,
                            }),
                        },
                    }}
                />
                {sections.map((section) => (
                    <Stack.Screen
                        key={section.path}
                        name={section.path}
                        options={{ title: section.name }}
                    />
                ))}
            </Stack>
            <StatusBar style={uniwindTheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
    )
}
