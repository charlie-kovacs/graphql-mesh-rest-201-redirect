import { defineConfig } from '@graphql-hive/gateway';
import fetch from 'node-fetch';

export const gatewayConfig = defineConfig({
  fetchAPI: {
    // @ts-ignore - the type definition exposed for this property doesn't seem to be correct 
    fetch
  }
})