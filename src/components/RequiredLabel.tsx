import type React from "react";

interface RequiredLabelProps {
	text: string;
	required?: boolean;
}

const RequiredLabel: React.FC<RequiredLabelProps> = ({
	text,
	required = false,
}) => (
	<>
		{text}
		{required ? <span className="text-danger ms-1">*</span> : null}
	</>
);

export default RequiredLabel;
