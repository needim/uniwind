import { ThemedText } from '@/components/themed-text'
import { useHeaderHeight } from '@react-navigation/elements'
import { ScrollView } from 'react-native'

export default function FormSheetWithScrollView() {
    const headerHeight = useHeaderHeight()

    return (
        <ScrollView
            className="w-full grow px-4"
            contentContainerClassName="p-4 gap-4"
            showsVerticalScrollIndicator={false}
            style={{
                paddingTop: headerHeight,
                marginBottom: -headerHeight,
                borderWidth: 1,
                borderColor: 'transparent',
            }}
        >
            {Array.from({ length: 40 }).map((_, index) => (
                <ThemedText className="border-b border-border pb-2" key={index}>Uniwind {index + 1}</ThemedText>
            ))}
        </ScrollView>
    )
}
