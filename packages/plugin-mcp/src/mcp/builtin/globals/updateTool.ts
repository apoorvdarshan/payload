import {
  getGlobalVirtualFieldNames,
  stripVirtualFields,
  transformPointDataToPayload,
  updateGlobalInputSchema,
} from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { validateGlobalData } from '../validateEntityData.js'

const DEFAULT_DESCRIPTION = 'Update any Payload global by passing the global slug and data.'

export const updateGlobalTool = defineGlobalTool({
  access: (args) => defaultAccess(args) && Boolean(args.permissions?.globals?.[args.slug]?.update),
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Update Global',
  },
  description: DEFAULT_DESCRIPTION,
  input: updateGlobalInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })

  const {
    data,
    depth,
    draft,
    fallbackLocale,
    locale,
    overrideLock,
    populate,
    publishAllLocales,
    select,
    unpublishAllLocales,
  } = input

  logger.info(`Updating global: ${slug}, draft: ${draft}${locale ? `, locale: ${locale}` : ''}`)

  try {
    const virtualFieldNames = getGlobalVirtualFieldNames(payload.config, slug)
    const inputData = stripVirtualFields(data, virtualFieldNames)
    const validationError = validateGlobalData({ slug, data: inputData, req })

    if (validationError) {
      return validationError
    }

    const parsedData = transformPointDataToPayload(inputData)

    const updateOptions: Parameters<typeof payload.updateGlobal>[0] = {
      slug,
      data: parsedData,
      depth,
      draft,
      overrideAccess: authorizedMCP.overrideAccess,
      overrideLock,
      populate,
      publishAllLocales,
      req,
      unpublishAllLocales,
    }

    if (locale) {
      updateOptions.locale = locale
    }
    if (fallbackLocale !== undefined) {
      updateOptions.fallbackLocale = fallbackLocale
    }
    if (select) {
      updateOptions.select = select
    }

    const result = await payload.updateGlobal(updateOptions)

    return {
      content: [
        {
          type: 'text',
          text: `Global "${slug}" updated successfully!\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error updating global ${slug}: ${errorMessage}`)
    return {
      content: [{ type: 'text', text: `Error updating global "${slug}": ${errorMessage}` }],
    }
  }
})
