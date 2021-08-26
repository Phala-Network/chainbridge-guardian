import { generate } from '@graphql-codegen/cli'
import { typesChain } from '@phala/typedefs'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { config as configureDotEnv } from 'dotenv'
import execa from 'execa'
import { mkdir, writeFile } from 'fs/promises'
import { series } from 'gulp'
import { resolve } from 'path'

configureDotEnv()

const DEFAULT_NETWORK_ENDPOINT = 'wss://khala-api.phala.network/ws'

const endpoint = process.env['NETWORK_ENDPOINT'] ?? DEFAULT_NETWORK_ENDPOINT

export const graphql = async (): Promise<void> => {
    await generate({
        generates: {
            './src/ingestors/subgraph/graphql/index.ts': {
                documents: resolve(__dirname, 'src', 'ingestors', 'subgraph', 'graphql', 'documents.graphql'),
                schema: resolve(__dirname, 'src', 'ingestors', 'subgraph', 'graphql', 'schema.graphql'),
                config: {
                    scalars: {
                        BigInt: 'string',
                        Bytes: 'string',
                    },
                    strictScalars: true,
                },
                plugins: ['typescript', 'typescript-graphql-request', 'typescript-operations'],
            },
            './src/ingestors/subquery/graphql/index.ts': {
                documents: resolve(__dirname, 'src', 'ingestors', 'subquery', 'graphql', 'documents.graphql'),
                schema: resolve(__dirname, 'src', 'ingestors', 'subquery', 'graphql', 'schema.graphql'),
                config: {
                    scalars: {
                        BigFloat: 'string',
                    },
                    strictScalars: true,
                },
                plugins: ['typescript', 'typescript-graphql-request', 'typescript-operations'],
            },
        },
    })
}

export const typegenFromDefinitions = async (): Promise<void> => {
    const provider = new WsProvider(endpoint)
    const api = await ApiPromise.create({ provider, typesChain })
    const chain = (await api.rpc.system.chain()).toString()
    await provider.disconnect()

    console.info(`Generating type definition, chain=${chain}, reflect_endpoint=${endpoint}`)

    const definitions = `
        import { typesChain } from '@phala/typedefs'

        export default {
            types: typesChain['${chain}']
        }
    `

    const interfacesPath = resolve(__dirname, 'src', 'ingestors', 'polkadot', 'interfaces', 'phala')
    await mkdir(interfacesPath, { recursive: true })
    await writeFile(resolve(interfacesPath, 'definitions.ts'), definitions)

    await execa(
        'ts-node',
        [
            '--skip-project',
            'node_modules/@polkadot/typegen/scripts/polkadot-types-from-defs.cjs',
            '--package',
            '.',
            '--input',
            './src/ingestors/polkadot/interfaces',
        ],
        {
            stdio: 'inherit',
        }
    )
}

export const typegenFromMetadata = async (): Promise<void> => {
    console.info('Generating from metadata using endpoint:', endpoint)

    await execa(
        'ts-node',
        [
            '--skip-project',
            'node_modules/@polkadot/typegen/scripts/polkadot-types-from-chain.cjs',
            '--package',
            '.',
            '--output',
            './src/ingestors/polkadot/interfaces',
            '--endpoint',
            endpoint,
        ],
        {
            stdio: 'inherit',
        }
    )
}

export const typegen = series(typegenFromDefinitions, typegenFromMetadata)

export const configure = series(graphql, typegen)
