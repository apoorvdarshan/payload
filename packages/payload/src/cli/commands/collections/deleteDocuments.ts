import type { Payload } from '../../../index.js'

import { deleteDocumentsInputSchema } from '../../../collections/operations/inputSchemas.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { parseFallbackLocale, parseID, parseJSON } from '../data/input.js'
import { printJSON } from '../data/utilities.js'

export const createDeleteDocumentsCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>', parse: parseID },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Delete documents from a local collection by ID or where query.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const result = await payload.delete({
      id: args.id,
      collection: args.slug,
      depth: args.depth,
      fallbackLocale: args.fallbackLocale,
      locale: args.locale,
      overrideAccess: true,
      where: args.where,
    } as Parameters<Payload['delete']>[0])

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: deleteDocumentsInputSchema,
})
