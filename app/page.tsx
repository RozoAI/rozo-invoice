import BoxedCard from "@/components/boxed-card";
import { ScanQRButton } from "@/components/scan-qr-button";
import { CardContent } from "@/components/ui/card";

export default function Home() {
		return (
		<BoxedCard className="flex-1">
			<CardContent className="m-auto w-full">
				{/* <div className="mb-auto flex flex-col items-center justify-center gap-1">
					<Avatar className="size-8 rounded-none">
						<AvatarImage
							src={theme === Theme.DARK ? "/logo-white.png" : "/logo.png"}
							alt="Rozo Pay"
						/>
					</Avatar>
					<span className="font-bold text-foreground text-xl ">Rozo Pay</span>
				</div> */}

				{/* <p className="my-4 text-center text-lg">
					Experience effortless, secure crypto payments with Rozo Pay. Our
					platform makes digital transactions fast, reliable, and accessible to
					everyone. Start accepting and sending crypto with confidence—no
					technical expertise required.
				</p> */}

				{/* {loaderData.appId && <ScanQRButton appId={loaderData.appId} />} */}
				<ScanQRButton appId={"rozoInvoice"} />
			</CardContent>
		</BoxedCard>
	);
}
