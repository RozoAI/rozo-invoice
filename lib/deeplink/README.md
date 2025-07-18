# DeepLink QR Code Parser

A universal QR code parser that supports multiple blockchain protocols and payment standards.

## Overview

The DeepLink parser automatically detects and parses QR codes for:
- **Ethereum/EVM** addresses and EIP-681 payment requests
- **Solana** addresses and payment requests
- **Stellar** addresses and payment requests  
- **Website URLs**

## Quick Start

```typescript
import { parseQRCode } from "@/lib/deeplink";

// Parse any QR code string
const result = parseQRCode(qrCodeString);
console.log(result.type); // "eip681" | "address" | "solana" | "stellar" | "website" | "unknown"
```

## Supported Formats

### Ethereum/EVM
- **EIP-681 Payment Requests**: `ethereum:0x...@chainId/function?params`
- **EVM Addresses**: `0x...` (automatically defaults to Base network USDC)

### Solana
- **Solana Pay**: `solana:address?params`
- **Solana Addresses**: Base58 encoded addresses

### Stellar
- **Stellar Pay**: `web+stellar:pay?params`
- **Stellar Addresses**: G-prefixed addresses

### Websites
- **HTTP/HTTPS URLs**: Any valid web URL

## Return Types

```typescript
interface QRCodeData {
  type: "website" | "eip681" | "address" | "solana" | "stellar" | "unknown";
  website?: string;           // For website URLs
  transfer?: EIP681Transfer;  // For payment requests
  address?: string;           // For blockchain addresses
  chainId?: number;           // For EVM chains
  message?: string;           // User-friendly messages
}
```

## Examples

```typescript
// EIP-681 Payment Request
parseQRCode("ethereum:0xA0b86a33E6441b8c4C8C1C1B8c4C8C1C1B8c4C8C@8453/transfer?address=0x123...&uint256=1000000")
// Returns: { type: "eip681", transfer: { protocol: "ethereum", ... } }

// EVM Address
parseQRCode("0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6")
// Returns: { type: "address", transfer: { protocol: "ethereum", chainId: 8453, ... } }

// Website
parseQRCode("https://rozo.ai")
// Returns: { type: "website", website: "https://rozo.ai" }

// Solana Address
parseQRCode("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU")
// Returns: { type: "solana", address: "...", message: "Solana payment coming soon." }
```

## Architecture

The parser uses a **chain of responsibility** pattern:

1. **Website Parser**: Checks for HTTP/HTTPS URLs first
2. **Ethereum Parser**: Handles EIP-681 and EVM addresses
3. **Solana Parser**: Detects Solana Pay and addresses
4. **Stellar Parser**: Handles Stellar Pay and addresses
5. **Fallback**: Returns `{ type: "unknown" }` if no parser matches

## Adding New Protocols

To add support for a new blockchain:

1. Create a new parser file (e.g., `bitcoin.ts`)
2. Export a `parseBitcoin(input: string): QRCodeData | null` function
3. Add it to the parsers array in `index.ts`
4. Update the `QRCodeType` in `types.ts`

```typescript
// Example: Adding Bitcoin support
export function parseBitcoin(input: string): QRCodeData | null {
  const bitcoinRegex = /^bitcoin:([13][a-km-zA-HJ-NP-Z1-9]{25,34})/;
  if (bitcoinRegex.test(input)) {
    return {
      type: "bitcoin",
      address: input,
      message: "Bitcoin payment coming soon."
    };
  }
  return null;
}
```

## Error Handling

- Invalid formats return `null` from individual parsers
- Unrecognized inputs return `{ type: "unknown" }`
- All parsers are safe and won't throw exceptions

## Usage in Components

```typescript
import { parseQRCode } from "@/lib/deeplink";

function QRScanner() {
  const handleQRCode = (qrData: string) => {
    const parsed = parseQRCode(qrData);
    
    switch (parsed.type) {
      case "eip681":
        // Handle Ethereum payment
        break;
      case "website":
        // Open website
        window.open(parsed.website);
        break;
      case "unknown":
        // Show error message
        break;
    }
  };
}
``` 