// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { TransparentUpgradeableProxy } from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import { SsoUtils } from "./helpers/SsoUtils.sol";

/// @title TransparentProxy
/// @author Matter Labs
/// @custom:security-contact security@matterlabs.dev
/// @notice This contract is modification of OpenZeppelin `TransparentUpgradeableProxy` with optimisation for
/// cheap delegate calls on ZKsync.
/// @dev This proxy is placed in front of `AAFactory` and all modules (`WebAuthValidator`, `SessionKeyValidator`).
contract TransparentProxy is TransparentUpgradeableProxy {
  constructor(
    address implementation,
    bytes memory data
  ) TransparentUpgradeableProxy(implementation, msg.sender, data) {}

  function _delegate(address implementation) internal override {
    SsoUtils.delegate(implementation);
  }
}
