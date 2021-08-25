import { generate } from '@graphql-codegen/cli'
import { resolve } from 'path'

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
