import type { RozoPayOrderView } from "@rozoai/intent-common";
import type { ReactElement } from "react";
import BoxedCard from "@/components/boxed-card";
import ChainsStacked from "@/components/chains-stacked";
import { ErrorContent } from "@/components/payment/error-content";
import { PaymentContent } from "@/components/payment/payment-content";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { CardContent, CardFooter } from "@/components/ui/card";

type LoaderData = {
	success: boolean;
	payment?: RozoPayOrderView;
	appId?: string;
	error?: unknown;
};

async function getPayment(id: string): Promise<LoaderData> {
	if (!id) {
		return { success: false, error: "Payment ID is required" };
	}

	try {
		const response = await fetch(`${process.env.DAIMO_API_URL}/payment/${id}`, {
			method: "GET",
			headers: {
				"Api-Key": process.env.NEXT_PUBLIC_DAIMO_API_KEY || "",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			return {
				success: false,
				error: `Failed to fetch payment data: ${response.statusText}`,
			};
		}

		const paymentData = (await response.json()) as RozoPayOrderView;
		return {
			success: true,
			payment: paymentData,
			appId: process.env.NEXT_PUBLIC_DAIMO_API_KEY,
		};
	} catch (error) {
		return { success: false, error };
	}
}

export default async function Checkout({
	searchParams,
}: {
	searchParams: Promise<{ id?: string }>;
}): Promise<ReactElement> {
  const {id} = await searchParams;
	const loaderData = await getPayment(id || "");

	return (
		<BoxedCard className="flex-1">
			<CardContent className="flex flex-1 flex-col items-center gap-8 p-8 text-center">
				{/* Logo and Brand */}
				<div className="flex flex-col items-center gap-1">
					<Avatar className="mx-auto size-8 rounded-none">
						<AvatarImage
							src="/logo.png"
							alt="Rozo Pay"
						/>
					</Avatar>
					<h1 className="font-bold text-foreground">Rozo Pay</h1>
				</div>

				{loaderData.success && loaderData.payment ? (
					<PaymentContent
						appId={loaderData.appId ?? ""}
						data={loaderData.payment}
					/>
				) : (
					<ErrorContent
						message={
							loaderData.error
								? String(loaderData.error)
								: "An unknown error occurred"
						}
					/>
				)}
			</CardContent>
			{loaderData.success && (
				<CardFooter className="pb-0 md:pb-8">
					<div className="mx-auto flex flex-row items-center justify-center gap-2">
						<ChainsStacked />
						<span className="text-muted-foreground text-sm">
							1000+ tokens accepted
						</span>
					</div>
				</CardFooter>
			)}
		</BoxedCard>
	);
}
