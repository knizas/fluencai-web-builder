import { useState } from 'react'
import { Button, Rows, Text, Title } from '@canva/app-ui-kit'
import { getDesignToken, requestExport } from '@canva/design'
import styles from './App.module.css'

const API_URL = 'https://web-builder.fluencai.com' // Change to your production URL

function App() {
    const [loading, setLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleGenerateWebsite = async () => {
        try {
            setLoading(true)
            setError(null)
            setPreviewUrl(null)

            // Get design token to access design data
            const token = await getDesignToken()

            // Request export of all pages
            const pages = await Promise.all(
                Array.from({ length: token.designInfo.pages.length }, async (_, i) => {
                    const pageId = token.designInfo.pages[i].id

                    // Export page as PNG
                    const pngExport = await requestExport({
                        acceptedFileTypes: ['PNG'],
                        pageIndex: i,
                    })

                    // TODO: Get page structured data (requires Canva API access)
                    // For now, we'll use PNG-only approach

                    return {
                        index: i,
                        name: token.designInfo.pages[i].title || `Page ${i + 1}`,
                        png: pngExport.exportUrl,
                        dimensions: {
                            width: token.designInfo.pages[i].dimensions.width,
                            height: token.designInfo.pages[i].dimensions.height,
                        },
                        structure: [], // Will be populated when Canva provides structured API
                    }
                })
            )

            // Send to Fluencai API
            const response = await fetch(`${API_URL}/api/canva/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pages,
                    designId: token.designInfo.id,
                    designTitle: token.designInfo.title || 'Untitled Design',
                }),
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()
            setPreviewUrl(data.previewUrl)

        } catch (err) {
            console.error('Error generating website:', err)
            setError(err instanceof Error ? err.message : 'Unknown error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <Rows spacing="2u">
                <Title size="medium">Fluencai Website Builder</Title>

                <Text size="small">
                    Transform your Canva design into a professional, responsive website in one click.
                </Text>

                {error && (
                    <div className={styles.error}>
                        <Text size="small" tone="critical">{error}</Text>
                    </div>
                )}

                {previewUrl && (
                    <div className={styles.success}>
                        <Text size="small" tone="positive">Website generated successfully!</Text>
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                            View Your Website →
                        </a>
                    </div>
                )}

                <Button
                    variant="primary"
                    onClick={handleGenerateWebsite}
                    loading={loading}
                    stretch
                >
                    {loading ? 'Generating...' : 'Generate Website'}
                </Button>

                <div className={styles.features}>
                    <Text size="xsmall" tone="tertiary">✓ Multi-page support</Text>
                    <Text size="xsmall" tone="tertiary">✓ Mobile responsive</Text>
                    <Text size="xsmall" tone="tertiary">✓ Professional icons</Text>
                </div>
            </Rows>
        </div>
    )
}

export default App
