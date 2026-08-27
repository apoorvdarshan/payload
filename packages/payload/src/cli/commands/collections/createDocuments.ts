import path from 'node:path'

import type { PopulateType, SelectType } from '../../../index.js'

import { createDocumentsLocalInputSchema } from '../../../collections/operations/inputSchemas.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import {
  localFileSchema,
  parseBoolean,
  parseDocuments,
  parseFallbackLocale,
  parseJSON,
} from '../data/input.js'
import { prepareCollectionData, printJSON } from '../data/utilities.js'

export const createCreateDocumentsCommand = defineCLICommand({
  cli: {
    documents: { flags: '--documents <json|@file>', parse: parseDocuments },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Create one or more documents in a local collection.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const collection = args.slug
    const docs: Array<{ doc: unknown; index: number }> = []
    const errors: Array<{ index: number; message: string }> = []

    for (const [index, { data, file }] of args.documents.entries()) {
      try {
        const doc = await payload.create({
          collection,
          data: prepareCollectionData({ collection, data, payload }),
          depth: args.depth,
          draft: args.draft,
          fallbackLocale: args.fallbackLocale,
          filePath: file ? path.resolve(process.cwd(), file) : undefined,
          locale: args.locale,
          overrideAccess: args.overrideAccess,
          overwriteExistingFiles: args.overwriteExistingFiles,
          populate: args.populate as PopulateType | undefined,
          publishAllLocales: args.publishAllLocales,
          select: args.select as SelectType | undefined,
          showHiddenFields: args.showHiddenFields,
        })

        docs.push({ doc, index })
      } catch (error) {
        errors.push({
          index,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const result = { docs, errors }

    if (!isJSON) {
      printJSON(result)
    }

    return {
      exitCode: errors.length > 0 ? 1 : undefined,
      result,
    }
  },
  helpGroup: 'Data commands',
  input: createDocumentsLocalInputSchema({ file: localFileSchema }),
})
