import type React from "react";

type TwitterIconProps = {
	className?: string;
	width?: string | number;
	height?: string | number;
};

export const TwitterIcon: React.FC<TwitterIconProps> = ({
	className,
	width = 44,
	height = 44,
	...props
}) => {
	return (
		<svg
			{...props}
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 24 24"
			aria-hidden="false"
			role="img"
			aria-labelledby="twitterIconTitle"
		>
			<title id="twitterIconTitle">Twitter/X</title>
			<path
				fill="currentColor"
				d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
			/>
		</svg>
	);
};
