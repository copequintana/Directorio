import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "bg-muted-bg text-foreground",
      success: "bg-success-bg text-success",
      warning: "bg-warning-bg text-warning",
      danger: "bg-danger-bg text-danger",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const ESTADO_VARIANT: Record<string, BadgeProps["variant"]> = {
  ACTIVA: "success",
  SIN_ASIGNAR: "neutral",
  MANTENIMIENTO: "warning",
  RESERVADA: "warning",
  INACTIVA: "danger",
};

const ESTADO_LABEL: Record<string, string> = {
  ACTIVA: "Activa",
  SIN_ASIGNAR: "Sin asignar",
  MANTENIMIENTO: "Mantenimiento",
  RESERVADA: "Reservada",
  INACTIVA: "Inactiva",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return <Badge variant={ESTADO_VARIANT[estado] ?? "neutral"}>{ESTADO_LABEL[estado] ?? estado}</Badge>;
}
