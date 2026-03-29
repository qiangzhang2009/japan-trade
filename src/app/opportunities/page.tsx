import { getOpportunities } from '@/lib/dataService';
import OpportunitiesClient from './OpportunitiesClient';

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities();
  return <OpportunitiesClient initialOpps={opportunities} />;
}
