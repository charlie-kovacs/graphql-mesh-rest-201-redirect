import { defineConfig } from '@graphql-mesh/compose-cli'
import { loadOpenAPISubgraph } from '@omnigraph/openapi'

export const composeConfig = defineConfig({
  subgraphs: [    
    {
      sourceHandler: loadOpenAPISubgraph('Todo API: Express', {
        source: './todo.express.openapi.json'
      })
    }
  ]
})