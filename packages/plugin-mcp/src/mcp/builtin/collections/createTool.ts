import type { PopulateType, SelectType } from 'payload'

import {
  createDocumentsInputSchema,
  getCollectionVirtualFieldNames,
  stripVirtualFields,
  transformPointDataToPayload,
} from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { validateCollectionData } from '../validateEntityData.js'
import { fileInputSchema, resolveFile } from './fileInput.js'
import { formatCollectionError } from './formatCollectionError.js'

const DEFAULT_DESCRIPTION =
  'Create one or more documents. Each can have different data or a file. Prefer uploadReference after upload, externalURL for URLs, or base64 for small local files.'

export const createDocumentsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.create),
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Create Documents',
  },
  description: DEFAULT_DESCRIPTION,
  input: createDocumentsInputSchema({ file: fileInputSchema }),
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { depth, documents, draft, fallbackLocale, locale, populate, publishAllLocales, select } =
    input

  logger.info(`Creating ${documents.length} documents in collection: ${slug}`)

  try {
    const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, slug)
    const docs: Array<{ doc: Record<string, unknown>; index: number }> = []
    const errors: Array<{ index: number; message: string }> = []
    let validationSchema: Record<string, unknown> | undefined

    for (const [index, document] of documents.entries()) {
      try {
        const inputData = stripVirtualFields(document.data, virtualFieldNames)
        const validationError = validateCollectionData({ slug, data: inputData, req })

        if (validationError) {
          const firstContent = validationError.content[0]
          const validationContent = validationError.structuredContent as
            | Record<string, unknown>
            | undefined
          const schema = validationContent?.schema

          if (!validationSchema && schema && typeof schema === 'object') {
            validationSchema = schema as Record<string, unknown>
          }

          errors.push({
            index,
            message:
              firstContent?.type === 'text'
                ? (firstContent.text.split('\n\nUse this schema')[0] ?? 'Invalid document data')
                : 'Invalid document data',
          })
          continue
        }

        const parsedData = transformPointDataToPayload(inputData)
        const file = await resolveFile({ slug, input: document.file, req })
        const result = await payload.create({
          collection: slug,
          data: parsedData,
          depth,
          draft,
          overrideAccess: authorizedMCP.overrideAccess,
          populate: populate as PopulateType | undefined,
          publishAllLocales,
          req,
          ...(file ? { file } : {}),
          ...(locale ? { locale } : {}),
          ...(fallbackLocale !== undefined ? { fallbackLocale } : {}),
          ...(select ? { select: select as SelectType } : {}),
        })

        docs.push({ doc: result as Record<string, unknown>, index })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        logger.error(`Error creating document at index ${index} in ${slug}: ${message}`)
        errors.push({ index, message })
      }
    }

    const batchResult = { docs, errors }
    const retryMessage = errors.length > 0 ? '\nRetry failed indexes only.' : ''
    const schemaMessage = validationSchema
      ? `\n\nUse this schema for data:\n\`\`\`json\n${JSON.stringify(validationSchema)}\n\`\`\``
      : ''
    const structuredContent = validationSchema
      ? { ...batchResult, schema: validationSchema }
      : batchResult

    logger.info(`Created ${docs.length} of ${documents.length} documents in ${slug}`)

    return {
      content: [
        {
          type: 'text',
          text: `Created ${docs.length} of ${documents.length} documents in collection "${slug}".${retryMessage}\nResults:\n\`\`\`json\n${JSON.stringify(batchResult)}\n\`\`\`${schemaMessage}`,
        },
      ],
      doc: structuredContent as unknown as Record<string, unknown>,
      isError: docs.length === 0 && errors.length > 0,
      structuredContent,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    logger.error(`Error creating documents in ${slug}: ${message}`)
    return formatCollectionError({ slug, action: 'creating', error, req })
  }
})
