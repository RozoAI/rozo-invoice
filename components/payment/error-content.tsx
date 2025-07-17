import { TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";

/**
 * Interface for ErrorContent component props
 */
export interface ErrorContentProps {
	message: string;
}

/**
 * Error content component to display error messages
 */
export function ErrorContent({ message }: ErrorContentProps): ReactElement {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-2 pb-8">
			<TriangleAlert className="size-10 text-muted-foreground" />
			<span className="font-medium text-muted-foreground">{message}</span>
		</div>
	);
}
