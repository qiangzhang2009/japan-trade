import { getOpportunities, getCountries } from '@/lib/dataService';
import OpportunitiesClient from './OpportunitiesClient';

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  const [opportunities, countries] = await Promise.all([
    getOpportunities(),
    getCountries(),
  ]);
  return <OpportunitiesClient initialOpps={opportunities} countries={countries} />;
}
