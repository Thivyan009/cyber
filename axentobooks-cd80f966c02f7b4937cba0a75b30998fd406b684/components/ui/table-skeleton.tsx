import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  showHeader?: boolean;
  cellWidths?: string[];
  hasActions?: boolean;
}

export function TableSkeleton({
  columnCount = 4,
  rowCount = 5,
  showHeader = true,
  cellWidths = [],
  hasActions = true,
}: TableSkeletonProps) {
  // If cellWidths not provided, generate some reasonable defaults
  const widths = cellWidths.length
    ? cellWidths
    : Array(columnCount)
        .fill(0)
        .map(() => `${Math.floor(Math.random() * 30) + 20}%`);

  return (
    <div className="rounded-md border">
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columnCount }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4" style={{ width: widths[index] }} />
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className="w-[100px]">
                  <Skeleton className="h-4 w-[60px]" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columnCount }).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton
                    className="h-4"
                    style={{ width: widths[cellIndex] }}
                  />
                </TableCell>
              ))}
              {hasActions && (
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-8 w-[80px]" />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
