/**
 * Shared input schemas for global data commands.
 *
 * The Payload CLI and MCP plugin use these schemas so they accept and validate the same input.
 * Local variants include trusted options that should only be available to local callers.
 */
import {
  dataSchema,
  defaultLimitSchema,
  defaultPageSchema,
  depthSchema,
  fallbackLocaleSchema,
  idSchema,
  localeSchema,
  overrideLockSchema,
  paginationSchema,
  populateSchema,
  publishAllLocalesSchema,
  selectSchema,
  showHiddenFieldsSchema,
  slugSchema,
  sortSchema,
  unpublishAllLocalesSchema,
  whereSchema,
  writeDraftSchema,
} from '../../utilities/sharedInputSchemas.js'
import { strictObject } from '../../utilities/zod.js'

export const countGlobalVersionsInputSchema = strictObject({
  slug: slugSchema,
  locale: localeSchema,
  where: whereSchema,
})

const findGlobalInputShape = {
  slug: slugSchema,
  depth: depthSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  populate: populateSchema,
  select: selectSchema,
}

export const findGlobalInputSchema = strictObject(findGlobalInputShape)

/** For trusted local callers only. Includes hidden fields. */
export const findGlobalLocalInputSchema = strictObject({
  ...findGlobalInputShape,
  showHiddenFields: showHiddenFieldsSchema,
})

const findGlobalVersionByIDInputShape = {
  id: idSchema,
  slug: slugSchema,
  depth: depthSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  populate: populateSchema,
  select: selectSchema,
}

export const findGlobalVersionByIDInputSchema = strictObject(findGlobalVersionByIDInputShape)

/** For trusted local callers only. Includes hidden fields. */
export const findGlobalVersionByIDLocalInputSchema = strictObject({
  ...findGlobalVersionByIDInputShape,
  showHiddenFields: showHiddenFieldsSchema,
})

const findGlobalVersionsInputShape = {
  slug: slugSchema,
  depth: depthSchema,
  fallbackLocale: fallbackLocaleSchema,
  limit: defaultLimitSchema,
  locale: localeSchema,
  page: defaultPageSchema,
  pagination: paginationSchema,
  populate: populateSchema,
  select: selectSchema,
  sort: sortSchema,
  where: whereSchema,
}

export const findGlobalVersionsInputSchema = strictObject(findGlobalVersionsInputShape)

/** For trusted local callers only. Includes hidden fields. */
export const findGlobalVersionsLocalInputSchema = strictObject({
  ...findGlobalVersionsInputShape,
  showHiddenFields: showHiddenFieldsSchema,
})

export const getGlobalSchemaInputSchema = strictObject({
  slug: slugSchema,
})

const restoreGlobalVersionInputShape = {
  id: idSchema,
  slug: slugSchema,
  depth: depthSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  populate: populateSchema,
  select: selectSchema,
}

export const restoreGlobalVersionInputSchema = strictObject(restoreGlobalVersionInputShape)

/** For trusted local callers only. Includes hidden fields. */
export const restoreGlobalVersionLocalInputSchema = strictObject({
  ...restoreGlobalVersionInputShape,
  showHiddenFields: showHiddenFieldsSchema,
})

const updateGlobalInputShape = {
  slug: slugSchema,
  data: dataSchema,
  depth: depthSchema,
  draft: writeDraftSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  overrideLock: overrideLockSchema,
  populate: populateSchema,
  publishAllLocales: publishAllLocalesSchema,
  select: selectSchema,
  unpublishAllLocales: unpublishAllLocalesSchema,
}

export const updateGlobalInputSchema = strictObject(updateGlobalInputShape)

/** For trusted local callers only. Includes hidden fields. */
export const updateGlobalLocalInputSchema = strictObject({
  ...updateGlobalInputShape,
  showHiddenFields: showHiddenFieldsSchema,
})
