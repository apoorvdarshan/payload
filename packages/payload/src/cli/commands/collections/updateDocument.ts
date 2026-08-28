import path from 'node:path'

import { updateDocumentLocalInputSchema } from '../../../collections/operations/inputSchemas.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import {
  localFileSchema,
  parseBoolean,
  parseFallbackLocale,
  parseID,
  parseJSON,
  parseSort,
} from '../data/input.js'
import { prepareCollectionData, printJSON } from '../data/utilities.js'

export const createUpdateDocumentCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>', parse: parseID },
    data: { flags: '--data <json|@file>', parse: parseJSON },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
    sort: { flags: '--sort <field>', parse: parseSort },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Update documents in a local collection by ID or where query.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const collection = args.slug
    const data = prepareCollectionData({ collection, data: args.data, payload })
    let result

    if (args.id !== undefined) {
      result = await payload.update({
        id: args.id,
        collection,
        data,
        depth: args.depth,
        draft: args.draft,
        fallbackLocale: args.fallbackLocale,
        filePath: args.file ? path.resolve(process.cwd(), args.file) : undefined,
        locale: args.locale,
        overrideAccess: args.overrideAccess,
        overrideLock: args.overrideLock,
        overwriteExistingFiles: args.overwriteExistingFiles,
        populate: args.populate,
        publishAllLocales: args.publishAllLocales,
        select: args.select,
        showHiddenFields: args.showHiddenFields,
        trash: args.trash,
        unpublishAllLocales: args.unpublishAllLocales,
      })
    } else if (args.where !== undefined) {
      result = await payload.update({
        collection,
        data,
        depth: args.depth,
        draft: args.draft,
        fallbackLocale: args.fallbackLocale,
        filePath: args.file ? path.resolve(process.cwd(), args.file) : undefined,
        limit: args.limit,
        locale: args.locale,
        overrideAccess: args.overrideAccess,
        overrideLock: args.overrideLock,
        overwriteExistingFiles: args.overwriteExistingFiles,
        populate: args.populate,
        publishAllLocales: args.publishAllLocales,
        select: args.select,
        showHiddenFields: args.showHiddenFields,
        sort: args.sort,
        trash: args.trash,
        unpublishAllLocales: args.unpublishAllLocales,
        where: args.where,
      })
    } else {
      throw new Error('Either id or where must be provided.')
    }

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: updateDocumentLocalInputSchema({ file: localFileSchema }),
})
