import { registerNewPasskey } from "zksync-account/client/passkey";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { deployAccount } from "zksync-account/client";
import { zksyncInMemoryNode } from "viem/chains";
import { parseEther, toHex } from "viem";
import { useAccountFetch } from "./useAccountFetch";

export async function useAccountRegistration(_username: MaybeRef<string>) {
  const username = toRef(_username);
  const { getRichWalletClient } = useClientStore();
  const chainId = zksyncInMemoryNode.id;
  const { login } = useAccountStore();

  const {
    status: registerInProgress,
    execute: createAccount,
    error: registerError,
  } = await useAsyncData(async () => {
    const { accountData, fetchAccountData } = await useAccountFetch("registration", username, chainId);
    await fetchAccountData();
    if (accountData.value) {
      throw new Error("Username is taken.");
    }

    const { credentialPublicKey } = await registerNewPasskey({
      userName: username.value,
      userDisplayName: username.value,
    }).catch(() => {
      throw new Error("Failed to register new passkey.");
    });

    const deployerClient = getRichWalletClient({ chainId: chainId });
    const sessionKey = generatePrivateKey();
    const sessionPublicKey = privateKeyToAddress(sessionKey);

    // Breaks at this following step

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { address } = await deployAccount(deployerClient as any, {
      credentialPublicKey,
      uniqueAccountId: username.value,
      /* TODO: Remove spend limit, right now deployment fails without initial data */
      initialSessions: [
        {
          sessionPublicKey,
          expiresAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
          spendLimit: {
            "0x111C3E89Ce80e62EE88318C2804920D4c96f92bb": "10000",
          },
        },
      ],
      contracts: contractsByChain[chainId],
    }).catch(() => {
      throw new Error("Failed to create a new account.");
    });

    await deployerClient.sendTransaction({
      to: address,
      value: parseEther("1"),
    }).catch(() => {
      throw new Error("Failed to send transaction.");
    });

    login({
      username: username.value,
      address: address,
      passkey: toHex(credentialPublicKey),
      sessionKey,
    });

    return true;
  }, {
    immediate: false,
  });

  return {
    registerInProgress,
    registerError,
    createAccount,
  };
}
