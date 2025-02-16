import NewFarmer from './NewFarmer';

interface PageProps {
  params: Record<string, string>;
  searchParams: Record<string, string>;
}

export default function NewFarmerPage({ params, searchParams }: PageProps) {
  return <NewFarmer />;
} 