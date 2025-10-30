// hooks/useFileField.ts
import { useEffect, useState } from 'react'
import { useFieldType } from 'payload/components/forms'

interface FileData {
  filename?: string
  [key: string]: any
}

interface UseFileFieldProps {
  path: string
}

const useFileField = ({ path }: UseFileFieldProps) => {
  const { value } = useFieldType<string>({ path })
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFileData = async () => {
      if (!value) {
        console.log('No value found for path:', path) // Debug log
        return
      }

      console.log('Fetching file data for value (ID):', value) // Log the file ID

      setLoading(true)
      try {
        const response = await fetch(`/api/audio/${value}`) // Fetch the file data
        console.log('Fetch response status:', response.status) // Log the response status

        if (!response.ok) {
          throw new Error(`Failed to fetch file data: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('Fetched file data:', data) // Log the full fetched data

        if (!data || !data.filename) {
          console.log('Fetched data is missing a filename:', data) // Log when filename is missing
        }

        setFileData(data)
      } catch (err) {
        console.error('Error fetching file data:', err) // Log the error
        setError('Failed to fetch file data')
      } finally {
        setLoading(false)
      }
    }

    fetchFileData()
  }, [value, path])

  // Construct the file URL using the filename
  const fileUrl = fileData?.filename
    ? `http://localhost:3000/media/audio/${fileData.filename}`
    : null

  console.log('Constructed file URL:', fileUrl) // Log the constructed URL
  return { fileUrl, loading, error }
}

export default useFileField
