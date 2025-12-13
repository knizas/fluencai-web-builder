import { useState } from 'react'
import { Button, Rows, Text, Title } from '@canva/app-ui-kit'
import { requestExport } from '@canva/design'
import styles from './App.module.css'

const API_URL = 'https://web-builder.fluencai.com'

function App() {
    const [loading, setLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleGenerateWebsite = async () => {
        try {
            setLoading(true)
            setError(null)
            setPreviewUrl(null)

            console.log('Requesting export...')
            const exportResult = await requestExport({
                acceptedFileTypes: ['png'],
            })

            console.log('Export result:', exportResult)

            // Check if export was completed or aborted
            if (exportResult.status === 'aborted') {
                throw new Error('Export was cancelled')
            }

            const mockPages = [{
                index: 0,
                name: 'Page 1',
                png: exportResult.exportBlobs[0].url,
                dimensions: {
                    width: 1200,
                    height: 800,
                },
                structure: [],
            }]

            console.log('Sending to API...')

            const response = await fetch(`${API_URL}/api/canva/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pages: mockPages,
                    designId: 'canva-' + Date.now(),
                    designTitle: 'My Design',
                }),
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()
            console.log('API response:', data)
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
                        <Text size="small">{error}</Text>
                    </div>
                )}

                {previewUrl && (
                    <div className={styles.success}>
                        <Text size="small">Website generated successfully!</Text>
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
