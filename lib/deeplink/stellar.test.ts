import { describe, expect, it } from "vitest";
import { parseStellar } from "./stellar";
import type { StellarParseResult } from "./types";

describe("Stellar Parser", () => {
  describe("Pay Operation", () => {
    it("should parse simple XLM payment", () => {
      const input =
        "web+stellar:pay?destination=GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34&amount=120.5";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "pay",
        address: "GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34",
        amount: "120.5",
        message: "Stellar payment for 120.5 native",
      });
    });

    it("should parse USD payment with asset issuer", () => {
      const input =
        "web+stellar:pay?destination=GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34&amount=100&asset_code=USD&asset_issuer=GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "pay",
        address: "GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34",
        amount: "100",
        asset: {
          code: "USD",
          issuer: "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7",
        },
        message: "Stellar payment for 100 USD",
      });
    });

    it("should parse payment with memo and message", () => {
      const input =
        "web+stellar:pay?destination=GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34&amount=50&memo=Invoice%20%23123&memo_type=text&msg=Payment%20for%20services";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "pay",
        address: "GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34",
        amount: "50",
        memo: "Invoice #123",
        memo_type: "text",
        msg: "Payment for services",
        message: "Stellar payment for 50 native - Payment for services",
      });
    });

    it("should parse payment with callback and network", () => {
      const input =
        "web+stellar:pay?destination=GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34&amount=25.75&callback=https%3A%2F%2Fexample.com%2Fcallback&network_passphrase=Test%20SDF%20Network%20%3B%20September%202015";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "pay",
        address: "GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34",
        amount: "25.75",
        callback: "https://example.com/callback",
        network_passphrase: "Test SDF Network ; September 2015",
        message: "Stellar payment for 25.75 native",
      });
    });

    it("should parse payment with all parameters", () => {
      const input =
        "web+stellar:pay?destination=GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34&amount=200&asset_code=USDC&asset_issuer=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN&memo=12345&memo_type=id&callback=https%3A%2F%2Fwallet.example.com%2Fcallback&msg=Monthly%20subscription&network_passphrase=Public%20Global%20Stellar%20Network%20%3B%20September%202015&origin_domain=example.com&signature=abcd1234";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "pay",
        address: "GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34",
        amount: "200",
        asset: {
          code: "USDC",
          issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        },
        memo: "12345",
        memo_type: "id",
        callback: "https://wallet.example.com/callback",
        msg: "Monthly subscription",
        network_passphrase: "Public Global Stellar Network ; September 2015",
        origin_domain: "example.com",
        signature: "abcd1234",
        message: "Stellar payment for 200 USDC - Monthly subscription",
      });
    });

    it("should return error for pay operation without destination", () => {
      const input = "web+stellar:pay?amount=100";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "pay",
        message: "Error: Invalid Stellar payment URI - missing destination",
      });
    });

    it("should return error for pay operation with invalid destination", () => {
      const input = "web+stellar:pay?destination=INVALID_ADDRESS&amount=100";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "pay",
        message:
          "Error: Invalid Stellar payment URI - invalid destination address",
      });
    });

    it("should handle extra parameters", () => {
      const input =
        "web+stellar:pay?destination=GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34&amount=100&custom_param=value&another_param=test";
      const result = parseStellar(input) as StellarParseResult;

      expect(result.extra_params).toEqual({
        custom_param: "value",
        another_param: "test",
      });
    });
  });

  describe("TX Operation", () => {
    it("should parse simple transaction", () => {
      const input =
        "web+stellar:tx?xdr=AAAAAB%2BLPp%2BwygWy7psQmHHxstTn4BaSJWFjCU%2BEuL9IbqCgAAAAZAAV%2FHwAAAABAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAA4fQXL%2BHr5%2BLq74jUGqFLjQjuZyRrQGtWgbRPKq1H6%2FsAAAABVVNEAAAAAACNlYd30HdCuLI54eyYjyX%2FpMCZdmkOjlvZmjFUJJKF7%2FZPzYAAAAAAAAAAAhqNgAAABAMUgfvpWY0v6qQGK6RqEVTRGc4vJHBzaYsRZcHLQYfTIqGEVWQKTOIm%2BVlMg%2FpSwcVGUqvCgK5nKTMzNs%2FVaF%2FPxAY%3D";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "tx",
        xdr: "AAAAAB+LPp+wygWy7psQmHHxstTn4BaSJWFjCU+EuL9IbqCgAAAAZAAV/HwAAAABAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAA4fQXL+Hr5+Lq74jUGqFLjQjuZyRrQGtWgbRPKq1H6/sAAAABVVNEAAAAAACNlYd30HdCuLI54eyYjyX/pMCZdmkOjlvZmjFUJJKF7/ZPzYAAAAAAAAAAAhqNgAAABAMUgfvpWY0v6qQGK6RqEVTRGc4vJHBzaYsRZcHLQYfTIqGEVWQKTOIm+VlMg/pSwcVGUqvCgK5nKTMzNs/VaF/PxAY=",
        message: "Stellar transaction",
      });
    });

    it("should parse transaction with replace parameter", () => {
      const input =
        "web+stellar:tx?xdr=AAAAAB%2BLPp%2BwygWy7psQmHHxstTn4BaSJWFjCU%2BEuL9IbqCgAAAAZAAV%2FHwAAAABAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAA4fQXL%2BHr5%2BLq74jUGqFLjQjuZyRrQGtWgbRPKq1H6%2FsAAAABVVNEAAAAAACNlYd30HdCuLI54eyYjyX%2FpMCZdmkOjlvZmjFUJJKF7%2FZPzYAAAAAAAAAAAhqNgAAABAMUgfvpWY0v6qQGK6RqEVTRGc4vJHBzaYsRZcHLQYfTIqGEVWQKTOIm%2BVlMg%2FpSwcVGUqvCgK5nKTMzNs%2FVaF%2FPxAY%3D&replace=0%2C1";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "tx",
        xdr: "AAAAAB+LPp+wygWy7psQmHHxstTn4BaSJWFjCU+EuL9IbqCgAAAAZAAV/HwAAAABAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAA4fQXL+Hr5+Lq74jUGqFLjQjuZyRrQGtWgbRPKq1H6/sAAAABVVNEAAAAAACNlYd30HdCuLI54eyYjyX/pMCZdmkOjlvZmjFUJJKF7/ZPzYAAAAAAAAAAAhqNgAAABAMUgfvpWY0v6qQGK6RqEVTRGc4vJHBzaYsRZcHLQYfTIqGEVWQKTOIm+VlMg/pSwcVGUqvCgK5nKTMzNs/VaF/PxAY=",
        replace: "0,1",
        message: "Stellar transaction",
      });
    });

    it("should parse transaction with callback and message", () => {
      const input =
        "web+stellar:tx?xdr=AAAAAB%2BLPp%2BwygWy7psQmHHxstTn4BaSJWFjCU%2BEuL9IbqCgAAAAZAAV%2FHwAAAABAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAA4fQXL%2BHr5%2BLq74jUGqFLjQjuZyRrQGtWgbRPKq1H6%2FsAAAABVVNEAAAAAACNlYd30HdCuLI54eyYjyX%2FpMCZdmkOjlvZmjFUJJKF7%2FZPzYAAAAAAAAAAAhqNgAAABAMUgfvpWY0v6qQGK6RqEVTRGc4vJHBzaYsRZcHLQYfTIqGEVWQKTOIm%2BVlMg%2FpSwcVGUqvCgK5nKTMzNs%2FVaF%2FPxAY%3D&callback=https%3A%2F%2Fapi.example.com%2Ftx-callback&msg=Multi-operation%20transaction";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "tx",
        xdr: "AAAAAB+LPp+wygWy7psQmHHxstTn4BaSJWFjCU+EuL9IbqCgAAAAZAAV/HwAAAABAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAA4fQXL+Hr5+Lq74jUGqFLjQjuZyRrQGtWgbRPKq1H6/sAAAABVVNEAAAAAACNlYd30HdCuLI54eyYjyX/pMCZdmkOjlvZmjFUJJKF7/ZPzYAAAAAAAAAAAhqNgAAABAMUgfvpWY0v6qQGK6RqEVTRGc4vJHBzaYsRZcHLQYfTIqGEVWQKTOIm+VlMg/pSwcVGUqvCgK5nKTMzNs/VaF/PxAY=",
        callback: "https://api.example.com/tx-callback",
        msg: "Multi-operation transaction",
        message: "Stellar transaction - Multi-operation transaction",
      });
    });

    it("should parse transaction with all parameters", () => {
      const input =
        "web+stellar:tx?xdr=AAAAAB%2BLPp%2BwygWy7psQmHHxstTn4BaSJWFjCU%2BEuL9IbqCgAAAAZAAV%2FHwAAAABAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAA4fQXL%2BHr5%2BLq74jUGqFLjQjuZyRrQGtWgbRPKq1H6%2FsAAAABVVNEAAAAAACNlYd30HdCuLI54eyYjyX%2FpMCZdmkOjlvZmjFUJJKF7%2FZPzYAAAAAAAAAAAhqNgAAABAMUgfvpWY0v6qQGK6RqEVTRGc4vJHBzaYsRZcHLQYfTIqGEVWQKTOIm%2BVlMg%2FpSwcVGUqvCgK5nKTMzNs%2FVaF%2FPxAY%3D&replace=0%2C1&memo=TX123&memo_type=text&callback=https%3A%2F%2Fapi.example.com%2Ftx-callback&msg=Complex%20smart%20contract%20interaction&network_passphrase=Public%20Global%20Stellar%20Network%20%3B%20September%202015&origin_domain=dapp.example.com&signature=xyz789";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "tx",
        xdr: "AAAAAB+LPp+wygWy7psQmHHxstTn4BaSJWFjCU+EuL9IbqCgAAAAZAAV/HwAAAABAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAA4fQXL+Hr5+Lq74jUGqFLjQjuZyRrQGtWgbRPKq1H6/sAAAABVVNEAAAAAACNlYd30HdCuLI54eyYjyX/pMCZdmkOjlvZmjFUJJKF7/ZPzYAAAAAAAAAAAhqNgAAABAMUgfvpWY0v6qQGK6RqEVTRGc4vJHBzaYsRZcHLQYfTIqGEVWQKTOIm+VlMg/pSwcVGUqvCgK5nKTMzNs/VaF/PxAY=",
        replace: "0,1",
        memo: "TX123",
        memo_type: "text",
        callback: "https://api.example.com/tx-callback",
        msg: "Complex smart contract interaction",
        network_passphrase: "Public Global Stellar Network ; September 2015",
        origin_domain: "dapp.example.com",
        signature: "xyz789",
        message: "Stellar transaction - Complex smart contract interaction",
      });
    });

    it("should return error for tx operation without xdr", () => {
      const input = "web+stellar:tx?callback=https://example.com";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        operation: "tx",
        message: "Error: Invalid Stellar transaction URI - missing XDR",
      });
    });
  });

  describe("Plain Address", () => {
    it("should parse plain Stellar address", () => {
      const input = "GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34";
      const result = parseStellar(input) as StellarParseResult;

      expect(result).toEqual({
        type: "stellar",
        address: "GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34",
        message: "Stellar address",
      });
    });

    it("should reject invalid address format", () => {
      const input = "INVALID_STELLAR_ADDRESS";
      const result = parseStellar(input);

      expect(result).toBeNull();
    });

    it("should reject address with wrong length", () => {
      const input = "GCALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF3"; // 55 chars
      const result = parseStellar(input);

      expect(result).toBeNull();
    });

    it("should reject address with wrong starting character", () => {
      const input = "ACALNQQBXAPZ2WIRX3B2XI7GDRCEYQZYPAA7DQTMOS2246BEXOPOYF34";
      const result = parseStellar(input);

      expect(result).toBeNull();
    });
  });

  describe("Invalid Input", () => {
    it("should return null for completely invalid input", () => {
      const input = "not-a-stellar-uri";
      const result = parseStellar(input);

      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const input = "";
      const result = parseStellar(input);

      expect(result).toBeNull();
    });

    it("should return null for other blockchain URIs", () => {
      const input = "bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const result = parseStellar(input);

      expect(result).toBeNull();
    });

    it("should return null for malformed web+stellar URI", () => {
      const input = "web+stellar:invalid";
      const result = parseStellar(input);

      expect(result).toBeNull();
    });
  });
});
