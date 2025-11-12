"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export const AuthCard = ({ title, description, footer, children }: AuthCardProps) => {
  return (
    <Card className="w-full max-w-md shadow-xl shadow-primary/10">
      <CardHeader className="space-y-4 text-center">
        <CardTitle className="text-2xl font-semibold text-foreground">{title}</CardTitle>
        <CardDescription className="text-balance text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  );
};


