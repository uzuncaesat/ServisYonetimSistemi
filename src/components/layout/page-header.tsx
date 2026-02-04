import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  action?: ReactNode;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {action ? action : (
        actionLabel && (actionHref || onAction) && (
          actionHref ? (
            <Button asChild>
              <Link href={actionHref}>
                <Plus className="w-4 h-4 mr-2" />
                {actionLabel}
              </Link>
            </Button>
          ) : (
            <Button onClick={onAction}>
              <Plus className="w-4 h-4 mr-2" />
              {actionLabel}
            </Button>
          )
        )
      )}
    </div>
  );
}
