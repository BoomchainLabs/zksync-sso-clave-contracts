import { useStorage } from "@vueuse/core";

import type { AppMetadata } from "@matterlabs/smart-account-sdk";

export const useAppMeta = () => {
  const route = useRoute();

  const origin = computed(() => route.query.origin as string);
  const appMetaStorage = useStorage<{ [origin: string]: AppMetadata }>(
    "app-meta",
    {},
  );
  const appMeta = computed({
    get: () => appMetaStorage.value[origin.value],
    set: (value) => {
      appMetaStorage.value[origin.value] = value;
    },
  });

  return {
    appMeta,
    origin,
  };
};
