import { baseUSDC } from "@rozoai/intent-common";
import { describe, expect, it } from "vitest";
import { parseEthereum } from "../protocols/ethereum";
import type { EthereumParseResult } from "../types";

describe("Ethereum Parser", () => {
  const validAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
  const anotherAddress = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
  const usdcContract = baseUSDC.token;

  describe("Plain Address", () => {
    it("should parse a plain Ethereum address", () => {
      const result = parseEthereum(validAddress) as EthereumParseResult;
      expect(result).toEqual({
        type: "ethereum",
        address: validAddress,
        message: "Ethereum address",
      });
    });

    it("should reject an invalid address", () => {
      const result = parseEthereum("not-an-address");
      expect(result).toBeNull();
    });
  });

  describe("EIP-681: Native ETH Transfer", () => {
    it("should parse a native ETH transfer with value", () => {
      const input = `ethereum:${validAddress}?value=1.5e18`;
      const result = parseEthereum(input) as EthereumParseResult;
      expect(result).toEqual({
        type: "ethereum",
        operation: "transfer",
        address: validAddress,
        amount: "1.5e18",
        chain_id: 8453,
        message: "Ethereum transfer for 1.5e18 ETH",
      });
    });

    it("should parse a native ETH transfer with chain ID", () => {
      const input = `ethereum:${validAddress}@1?value=1e18`;
      const result = parseEthereum(input) as EthereumParseResult;
      expect(result.chain_id).toBe(1);
    });

    it("should handle a request with no value as a plain address query", () => {
      const input = `ethereum:${validAddress}`;
      const result = parseEthereum(input) as EthereumParseResult;
      expect(result).toEqual({
        type: "ethereum",
        address: validAddress,
        chain_id: 8453,
        message: "Ethereum address",
      });
    });
  });

  describe("EIP-681: ERC-20 Token Transfer", () => {
    it("should parse an ERC-20 transfer", () => {
      const input = `ethereum:${usdcContract}/transfer?address=${anotherAddress}&uint256=100.0e6`;
      const result = parseEthereum(input) as EthereumParseResult;
      expect(result).toEqual({
        type: "ethereum",
        operation: "transfer",
        address: usdcContract,
        asset: { contract: usdcContract },
        recipients: [{ address: anotherAddress, amount: "100.0e6" }],
        chain_id: 8453,
        message: "Ethereum transfer for 100.0e6 TOKEN",
      });
    });

    it("should handle missing recipient in ERC-20 transfer", () => {
      const input = `ethereum:${usdcContract}/transfer?uint256=100`;
      const result = parseEthereum(input) as EthereumParseResult;
      expect(result.message).toContain("missing or invalid recipient");
    });
  });

  describe("EIP-681: General Contract Call", () => {
    it("should parse a general contract call", () => {
      const input = `ethereum:${validAddress}/approve?address=${anotherAddress}&uint256=1e18`;
      const result = parseEthereum(input) as EthereumParseResult;
      expect(result).toEqual({
        type: "ethereum",
        operation: "approve",
        address: validAddress,
        chain_id: 8453,
        extra_params: {
          address: anotherAddress,
          uint256: "1e18",
        },
        message: "Contract call to approve",
      });
    });
  });

  describe("Invalid Input", () => {
    it("should return null for non-ethereum URI", () => {
      const result = parseEthereum("bitcoin:someaddress");
      expect(result).toBeNull();
    });

    it("should return error for invalid target address in URI", () => {
      const input = "ethereum:not-a-valid-address?value=1";
      const result = parseEthereum(input) as EthereumParseResult;
      expect(result.message).toContain("invalid target address");
    });
  });
});
