import { Arbitrum, Base, Ethereum, Polygon, Solana, Stellar } from "./icons/chains";

interface ChainLogo {
  type: string;
  component: React.ReactNode;
}

export const chainLogos: ChainLogo[] = [
  { type: "eth", component: <Ethereum width={24} height={24} /> },
  // { type: "usdc", component: <USDC width={24} height={24} /> },
  // { type: "optimism", component: <Optimism width={24} height={24} /> },
  { type: "arbitrum", component: <Arbitrum width={24} height={24} /> },
  { type: "base", component: <Base width={24} height={24} /> },
  { type: "polygon", component: <Polygon width={24} height={24} /> },
  { type: "solana", component: <Solana width={24} height={24} /> },
  { type: "stellar", component: <Stellar width={24} height={24} /> },
];

export default function ChainsStacked() {
  // CSS classes for logo container
  const logoContainerClasses =
    "border overflow-hidden rounded-full border-background";

  return (
    <div className="-space-x-2 flex *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
      {chainLogos.map((logo, index) => (
        <div
          key={logo.type}
          className={logoContainerClasses}
          style={{ zIndex: chainLogos.length - index }}
        >
          {logo.component}
        </div>
      ))}
    </div>
  );
}
