import { ListSection } from '@/components/list'
import { SectionScreen } from '@/components/shared'
import React, { useEffect, useState } from 'react'
import Animated, { FadeIn, FlipInXUp, LinearTransition } from 'react-native-reanimated'

const sentences = [
    'Hello world',
    'Reanimated is a library for animating React Native components',
    'The quick brown fox jumps over the lazy dog',
    'Lorem ipsum dolor sit amet',
]

export default function ReanimatedScreen() {
    const [sentenceIndex, setSentenceIndex] = useState(0)
    const [flatListData, setFlatListData] = useState<string[]>([sentences[0]])

    useEffect(() => {
        const interval = setInterval(() => {
            const nextSentenceIndex = (sentenceIndex + 1) % sentences.length
            setSentenceIndex(nextSentenceIndex)
            if (flatListData.length < sentences.length) {
                setFlatListData([...flatListData, sentences[nextSentenceIndex]])
            }
        }, 1000)

        return () => {
            clearInterval(interval)
        }
    }, [sentenceIndex, flatListData])

    return (
        <SectionScreen>
            <ListSection title="Animated.Text" containerClassName="p-2 items-center" useLinearTransition>
                <Animated.Text layout={LinearTransition} entering={FadeIn.delay(500)} className="tabular-nums text-foreground">
                    {sentences[sentenceIndex]}
                </Animated.Text>
            </ListSection>

            <ListSection title="Animated.FlatList" containerClassName="p-2" useLinearTransition>
                <Animated.View layout={LinearTransition} entering={FadeIn.delay(500)}>
                    <Animated.FlatList
                        data={flatListData}
                        className="flex-none"
                        contentContainerClassName="px-2"
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <Animated.View className="h-px bg-border" />}
                        layout={LinearTransition}
                        renderItem={({ item, index }) => (
                            <Animated.Text
                                key={item + index}
                                entering={FlipInXUp}
                                className="tabular-nums text-foreground py-2"
                            >
                                {item}
                            </Animated.Text>
                        )}
                    />
                </Animated.View>
            </ListSection>
        </SectionScreen>
    )
}
