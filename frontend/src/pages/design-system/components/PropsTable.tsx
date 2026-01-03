import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/Table';

interface PropDefinition {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description?: string;
}

interface PropsTableProps {
  props: PropDefinition[];
  className?: string;
}

export function PropsTable({ props, className = '' }: PropsTableProps) {
  return (
    <Table size="sm" className={className}>
      <TableHead>
        <TableRow>
          <TableHeader>Prop</TableHeader>
          <TableHeader>Type</TableHeader>
          <TableHeader>Default</TableHeader>
          <TableHeader>Required</TableHeader>
          <TableHeader>Description</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.map((prop) => (
          <TableRow key={prop.name}>
            <TableCell className="font-mono text-primary">
              {prop.name}
            </TableCell>
            <TableCell className="font-mono text-gray-600 dark:text-gray-400">
              {prop.type}
            </TableCell>
            <TableCell className="font-mono text-gray-500">
              {prop.default || '-'}
            </TableCell>
            <TableCell>
              {prop.required ? (
                <span className="text-error">Yes</span>
              ) : (
                <span className="text-gray-400">No</span>
              )}
            </TableCell>
            <TableCell className="text-gray-600 dark:text-gray-400">
              {prop.description || '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
