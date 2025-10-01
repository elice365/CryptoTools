import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/crypto/theme-toggle";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ToolHeaderProps {
  title: string;
  description: string;
}

export function ToolHeader({ title, description }: ToolHeaderProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </CardHeader>
    </Card>
  );
}
