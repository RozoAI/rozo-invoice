"use client";
import { useTheme } from "next-themes";
// import { DiscordIcon } from "@/components/icons/discord";
// import { TwitterIcon } from "@/components/icons/twitter";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Footer({ className }: { className?: string }) {
	const currentYear = new Date().getFullYear();
  const {resolvedTheme} = useTheme();

	return (
		<footer
			className={cn(
				"flex w-full flex-col items-center gap-4 text-center text-sm md:gap-6",
				className,
			)}
		>
			<div className="flex items-center gap-2">
				<Avatar className="size-6 rounded-none">
					<AvatarImage
						src={resolvedTheme === "dark" ? "/logo-white.png" : "/logo.png"}
						alt="Rozo Pay"
					/>
				</Avatar>
				<span className="font-bold text-foreground text-lg tracking-tight">
					ROZO
				</span>
			</div>
			<div className="flex items-center justify-center gap-4">
				<Link
					href="https://x.com/ROZOai"
					className="text-muted-foreground transition-colors hover:text-foreground"
				>
					{/* <TwitterIcon width={24} height={24} /> */}
				</Link>
				<Link
					href="https://discord.com/invite/EfWejgTbuU"
					className="text-muted-foreground transition-colors hover:text-foreground"
				>
					{/* <DiscordIcon width={24} height={24} /> */}
				</Link>
			</div>
			<p className="text-muted-foreground text-sm">
				&copy; {currentYear} ROZO, All rights reserved
			</p>
		</footer>
	);
}
