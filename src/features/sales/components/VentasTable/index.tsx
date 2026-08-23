import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4 align-middle">
          <div
            className={cn(
              "h-3 rounded-md bg-muted animate-pulse",
              i === 0 ? "w-12" : i % 2 === 0 ? "w-[65%]" : "w-[45%]",
            )}
          />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  emptyMessage = "Sin resultados",
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card/50 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-muted/30 border-b border-border">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className={cn(
                      "px-5 py-3.5 text-left text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap",
                      (h.column.columnDef.meta as any)?.stickyRight && "sticky right-0 bg-muted/95 backdrop-blur z-20 border-l border-border shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]"
                    )}
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-20 text-center text-sm font-sans text-muted-foreground/60"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-muted/40 group bg-card"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td 
                      key={cell.id} 
                      className={cn(
                        "px-5 py-3.5 align-middle",
                        (cell.column.columnDef.meta as any)?.stickyRight && "sticky right-0 bg-card z-10 border-l border-border group-hover:bg-muted/40 transition-colors shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
