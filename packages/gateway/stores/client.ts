import { createPublicClient, createWalletClient, http, publicActions, walletActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { zksync, zksyncInMemoryNode, zksyncSepoliaTestnet } from "viem/chains";
import { createZksyncPasskeyClient, type PasskeyRequiredContracts } from "zksync-account/client/passkey";

export const supportedChains = [zksync, zksyncSepoliaTestnet, zksyncInMemoryNode];
export type SupportedChainId = (typeof supportedChains)[number]["id"];
export const blockExplorerApiByChain: Record<SupportedChainId, string> = {
  [zksync.id]: zksync.blockExplorers.native.apiUrl,
  [zksyncSepoliaTestnet.id]: zksyncSepoliaTestnet.blockExplorers.native.blockExplorerApi,
  [zksyncInMemoryNode.id]: "http://localhost:8011",
};

type ChainContracts = PasskeyRequiredContracts & {
  accountFactory: NonNullable<PasskeyRequiredContracts["accountFactory"]>;
  accountImplementation: NonNullable<PasskeyRequiredContracts["accountImplementation"]>;
};
export const contractsByChain: Record<SupportedChainId, ChainContracts> = {
  [zksync.id]: {
    session: "0x",
    passkey: "0x",
    accountFactory: "0x",
    accountImplementation: "0x",
  },
  [zksyncSepoliaTestnet.id]: {
    session: "0x",
    passkey: "0x",
    accountFactory: "0x",
    accountImplementation: "0x",
  },
  [zksyncInMemoryNode.id]: {
    session: "0x3794aFA7eE728E1D0Deb2e3Ce1EcCc8824877b25",
    passkey: "0x5E2db1a7596a496198aaC31E57BBdef4CfBB4f18",
    accountFactory: "0x23b13d016E973C9915c6252271fF06cCA2098885",
    accountImplementation: "0xF0deB0ce167d4600f23DE3225661957BAD3a7214",
  },
};

export const useClientStore = defineStore("client", () => {
  const { address, username, passkey } = storeToRefs(useAccountStore());

  const getPublicClient = ({ chainId }: { chainId: SupportedChainId }) => {
    const chain = supportedChains.find((chain) => chain.id === chainId);
    if (!chain) throw new Error(`Chain with id ${chainId} is not supported`);

    const client = createPublicClient({
      chain,
      transport: http(),
    });

    return client;
  };

  const getClient = ({ chainId }: { chainId: SupportedChainId }) => {
    if (!address.value) throw new Error("Address is not set");
    const chain = supportedChains.find((chain) => chain.id === chainId);
    if (!chain) throw new Error(`Chain with id ${chainId} is not supported`);
    const contracts = contractsByChain[chainId];

    /*
      TODO: remove any
      `any` are set due to using zksync-account via `npm link`
      which makes it use same packages from different folders
      types are too complex to compare so it fails
    */
    const client = createZksyncPasskeyClient({
      address: address.value,
      credentialPublicKey: passkey.value!,
      userName: username.value!,
      userDisplayName: username.value!,
      contracts,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chain: chain as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transport: http() as any,
    });

    return client;
  };

  /* TODO: remove. Temp for local dev and debugging */
  const getRichWalletClient = ({ chainId }: { chainId: SupportedChainId }) => {
    const chain = supportedChains.find((chain) => chain.id === chainId);
    if (!chain) throw new Error(`Chain with id ${chainId} is not supported`);

    const richWalletClient = createWalletClient({
      account: privateKeyToAccount("0x3d3cbc973389cb26f657686445bcc75662b415b656078503592ac8c1abb8810e"),
      chain,
      transport: http(),
    })
      .extend(publicActions)
      .extend(walletActions);
    return richWalletClient;
  };

  return {
    getPublicClient,
    getClient,
    getRichWalletClient,
  };
});
