import type { Endpoint, PayloadHandler } from 'payload'

import { status as httpStatus } from 'http-status'
import * as qs from 'qs-esm'

import type { TestDataConfig } from './testDataConfig.js'

import { path } from './reInitializeDB.js'
import { resetAndSeed } from './resetAndSeed.js'

export const createReInitEndpoint = ({ seed, suite }: TestDataConfig): Endpoint => {
  let resetQueue = Promise.resolve()

  const handler: PayloadHandler = async (req) => {
    const { payload } = req

    if (!req.url) {
      throw new Error('Request URL is required')
    }

    const query: {
      deleteOnly?: string
    } = qs.parse(req.url.split('?')[1] ?? '', {
      depth: 10,
      ignoreQueryPrefix: true,
    })

    const reset = resetQueue.then(async () => {
      await resetAndSeed({
        deleteOnly: query.deleteOnly === 'true',
        payload,
        seed,
        suite,
      })
    })
    resetQueue = reset.catch(() => undefined)

    try {
      await reset

      return Response.json(
        {
          message: 'Database reset and seed run successfully.',
        },
        {
          status: httpStatus.OK,
        },
      )
    } catch (err) {
      payload.logger.error(err)
      return Response.json(err, {
        status: httpStatus.BAD_REQUEST,
      })
    }
  }

  return {
    handler,
    method: 'post',
    path,
  }
}
