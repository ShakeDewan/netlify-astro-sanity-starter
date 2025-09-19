import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';
import { createClient, type ClientConfig } from '@sanity/client';

const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_TOKEN, STACKBIT_PREVIEW, SANITY_PREVIEW_DRAFTS } = loadEnv(
    process.env.NODE_ENV || '',
    process.cwd(),
    ''
);
const isDev = import.meta.env.DEV;
const isDeployPreview = process.env.CONTEXT === 'deploy-preview';
const previewDrafts = STACKBIT_PREVIEW?.toLowerCase() === 'true' || SANITY_PREVIEW_DRAFTS?.toLowerCase() === 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let resolvedSanityConfig: ClientConfig | null = null;

if (SANITY_PROJECT_ID) {
    resolvedSanityConfig = {
        projectId: SANITY_PROJECT_ID,
        dataset: SANITY_DATASET || 'production',
        useCdn: false,
        apiVersion: '2024-01-31',
        token: SANITY_TOKEN,
        perspective: isDev || isDeployPreview || previewDrafts ? 'previewDrafts' : 'published'
    } satisfies ClientConfig;
}

export const sanityConfig = resolvedSanityConfig;
export const isSanityConfigured = Boolean(resolvedSanityConfig);
export const client = resolvedSanityConfig ? createClient(resolvedSanityConfig) : null;

if (client) {
    const trackedTypes = ['page'];
    client.listen(`*[_type in ${JSON.stringify(trackedTypes)}]`, {}, { visibility: 'query' }).subscribe(async (event: any) => {
        // only refresh when pages are deleted or created
        if (event.transition === 'appear' || event.transition === 'disappear') {
            const filePath = path.join(__dirname, '../layouts/Layout.astro');
            const time = new Date();

            // update the updatedAt stamp for the layout file, triggering astro to refresh the data in getStaticPaths
            await fs.promises.utimes(filePath, time, time);
        }
    });
}
