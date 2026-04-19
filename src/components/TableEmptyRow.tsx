import type React from "react";

interface TableEmptyRowProps {
	colSpan: number;
	message?: string;
}

const TableEmptyRow: React.FC<TableEmptyRowProps> = ({
	colSpan,
	message = "Aucun élément enregistré",
}) => (
	<tr>
		<td
			colSpan={colSpan}
			className="px-4 py-10 text-center text-sm text-muted-foreground italic"
		>
			{message}
		</td>
	</tr>
);

export default TableEmptyRow;
