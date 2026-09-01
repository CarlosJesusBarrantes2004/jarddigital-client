import { Download, FileText } from "lucide-react";

interface DocumentCardProps {
  url: string;
  name: string;
  kind: "PDF" | "DOCUMENT";
}

export const DocumentCard = ({ url, name, kind }: DocumentCardProps) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download={name}
      className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-3 py-2.5 min-w-[220px] max-w-[280px] hover:bg-sky-500/5 hover:border-sky-400/40 transition-colors"
    >
      <div className="size-10 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
        <FileText size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground truncate">{name}</p>
        <p className="text-[11px] text-muted-foreground">
          {kind === "PDF" ? "PDF" : "Documento"}
        </p>
      </div>
      <Download size={16} className="text-sky-600 shrink-0" />
    </a>
  );
};
