import { updateGlobalLocalInputSchema } from '../../../globals/operations/inputSchemas.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { parseBoolean, parseFallbackLocale, parseJSON } from '../data/input.js'
import { prepareGlobalData, printJSON } from '../data/utilities.js'

export const createUpdateGlobalCommand = defineCLICommand({
  cli: {
    data: { flags: '--data <json|@file>', parse: parseJSON },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Update a local global.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const slug = args.slug
    const result = await payload.updateGlobal({
      slug,
      data: prepareGlobalData({ slug, data: args.data, payload }),
      depth: args.depth,
      draft: args.draft,
      fallbackLocale: args.fallbackLocale,
      locale: args.locale,
      overrideAccess: args.overrideAccess,
      overrideLock: args.overrideLock,
      populate: args.populate,
      publishAllLocales: args.publishAllLocales,
      select: args.select,
      showHiddenFields: args.showHiddenFields,
      unpublishAllLocales: args.unpublishAllLocales,
    })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: updateGlobalLocalInputSchema,
})
