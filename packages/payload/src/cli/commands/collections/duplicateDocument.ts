import { duplicateDocumentLocalInputSchema } from '../../../collections/operations/inputSchemas.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import {
  parseBoolean,
  parseFallbackLocale,
  parseID,
  parseJSON,
  parseSelectedLocales,
} from '../data/input.js'
import { prepareCollectionData, printJSON } from '../data/utilities.js'

export const createDuplicateDocumentCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>', parse: parseID },
    data: { flags: '--data <json|@file>', parse: parseJSON },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
    selectedLocales: { flags: '--selected-locales <locale>', parse: parseSelectedLocales },
  },
  description: 'Duplicate a document in a local collection.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const collection = args.slug
    const result = await payload.duplicate({
      id: args.id,
      collection,
      data: args.data ? prepareCollectionData({ collection, data: args.data, payload }) : undefined,
      depth: args.depth,
      draft: args.draft,
      fallbackLocale: args.fallbackLocale,
      locale: args.locale,
      overrideAccess: args.overrideAccess,
      populate: args.populate,
      select: args.select,
      selectedLocales: args.selectedLocales,
      showHiddenFields: args.showHiddenFields,
    })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: duplicateDocumentLocalInputSchema,
})
