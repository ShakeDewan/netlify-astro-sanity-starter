import { client, isSanityConfigured } from '@utils/sanity-client';
import { IMAGE } from './blocks';

const CONFIG_QUERY_OBJ = `{
  _id,
  "favicon": {
    "src": favicon.asset->url
  },
  header {
    ...,
    logo ${IMAGE}
  },
  footer,
  titleSuffix
}`;

export async function fetchData() {
    if (!isSanityConfigured || !client) {
        return undefined;
    }

    return await client.fetch(`*[_type == "siteConfig"][0] ${CONFIG_QUERY_OBJ}`);
}
