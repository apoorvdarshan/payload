import type { Payload, SanitizedConfig } from 'payload'

import { getPayload } from 'payload'
import { test as vitestTest } from 'vitest'

import type { DatabaseAdapterType } from '../../dbAdapters.js'

import { getCurrentDatabaseAdapter } from '../../dbAdapters.js'
import { resetAndSeed } from '../shared/clearAndSeed/resetAndSeed.js'
import { getTestDataConfig } from '../shared/clearAndSeed/testDataConfig.js'
import { getSDK } from '../shared/getSDK.js'
import { mongooseList } from '../shared/isMongoose.js'
import { NextRESTClient } from '../shared/NextRESTClient.js'

type TestOptions = {
  /** Limits the test or suite to the selected database adapters. */
  db?: 'all' | 'drizzle' | 'mongo' | ((adapterType: DatabaseAdapterType) => boolean)
}

type TestSuiteOptions = {
  config?: Promise<SanitizedConfig> | SanitizedConfig
  cron?: boolean
} & TestOptions

type TestConfig = null | Promise<SanitizedConfig> | SanitizedConfig

type IntegrationFixtures = {
  $file: {
    config: SanitizedConfig
    /** Raw file-scoped instance for suite hooks. Tests should use `payload`. */
    payloadInstance: Payload
    testConfig: TestConfig
    testCron: boolean
  }
  $test: {
    payload: Payload
    restClient: NextRESTClient
    sdk: ReturnType<typeof getSDK>
  }
}

// Keep all fixtures in one extension so Vitest can trace test calls back to their source lines.
const testWithFixtures = vitestTest.extend<IntegrationFixtures>({
  config: [
    async ({ testConfig }, use) => {
      if (testConfig === null) {
        throw new Error(
          'This integration test requires Payload. Pass its config to test.suite({ config: testConfig })(...).',
        )
      }

      await use(await testConfig)
    },
    { scope: 'file' },
  ],
  payload: async ({ payloadInstance }, use) => {
    const testDataConfig = getTestDataConfig(payloadInstance.config)

    if (!testDataConfig) {
      throw new Error('Test suite metadata was not registered by buildConfigWithDefaults.')
    }

    await resetAndSeed({ payload: payloadInstance, ...testDataConfig })
    await use(payloadInstance)
  },
  payloadInstance: [
    async ({ config, testCron }, use) => {
      const payload = await getPayload({ config, cron: testCron })

      try {
        await use(payload)
      } finally {
        await payload.destroy()
      }
    },
    { scope: 'file' },
  ],
  restClient: async ({ payload }, use) => {
    await use(new NextRESTClient(payload.config))
  },
  sdk: async ({ payload }, use) => {
    await use(getSDK(payload.config))
  },
  testConfig: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(null)
    },
    { scope: 'file' },
  ],
  testCron: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(true)
    },
    { scope: 'file' },
  ],
})

/**
 * Integration test API with Payload's shared lifecycle and database filtering.
 *
 * Payload-backed test files supply their config to one root `test.suite`. Payload is initialized
 * lazily, once per file, and destroyed afterward. Before every test that uses Payload, REST, or the
 * SDK, the database and upload directories are reset and the suite's optional seed function is run.
 * REST and SDK clients are recreated per test. Standalone integration tests use `test.suite({})` and
 * do not initialize Payload.
 *
 * @example
 * import testConfig from './config.js'
 *
 * test.suite({ config: testConfig })('Posts', () => {
 *   test('reads posts', async ({ payload }) => {
 *     await payload.find({ collection: 'posts' })
 *   })
 * })
 */
export const test = Object.assign(testWithFixtures, {
  options: (options: TestOptions) => {
    const shouldRun = matchesDatabase(options)

    return Object.assign(testWithFixtures.runIf(shouldRun), {
      describe: testWithFixtures.describe.runIf(shouldRun),
    })
  },
  suite: ({ config, cron = true, db }: TestSuiteOptions) => {
    testWithFixtures.override('testConfig', config ?? null)
    testWithFixtures.override('testCron', cron)

    return testWithFixtures.describe.runIf(matchesDatabase({ db }))
  },
})

export const it = test

const isMongo = mongooseList.includes(process.env.PAYLOAD_DATABASE!)

const matchesDatabase = ({ db = 'all' }: TestOptions = {}): boolean => {
  if (typeof db === 'function') {
    return db(getCurrentDatabaseAdapter())
  }

  if (db === 'mongo') {
    return isMongo
  }

  if (db === 'drizzle') {
    return !isMongo
  }

  return true
}

export { isMongo }
