import {
  serviceGroups,
  softwareMenuGroups,
  type OfferingKind,
} from './taxonomy';

export type SearchScope = OfferingKind | '';

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

const serviceNames = new Set(
  serviceGroups
    .flatMap(({ label, children }) => [
      label,
      ...children.map((child) => child.label),
    ])
    .map(normalize),
);
const softwareNames = new Set(
  softwareMenuGroups
    .flatMap(({ label, children }) => [
      label,
      ...children.map((child) => child.label),
    ])
    .map(normalize),
);

export function recommendSearchScope(query: string): SearchScope {
  const term = normalize(query);
  if (/^desenvolvimento (?:de|sob)\b/.test(term)) return 'service';
  const service =
    /\b(consultoria|implantacao|implementacao|terceirizacao|agencia|prestador(?:es)?|servicos?|sob encomenda)\b/.test(
      term,
    );
  const software = /\b(software|saas|plataforma|ferramenta|sistema)\b/.test(
    term,
  );
  if (service && software) {
    return /^(consultoria|implantacao|implementacao|terceirizacao|agencia|servicos?)\b/.test(
      term,
    )
      ? 'service'
      : '';
  }
  if (service || software) return service ? 'service' : 'software';

  const serviceMatch = serviceNames.has(term);
  const softwareMatch = softwareNames.has(term);
  return serviceMatch === softwareMatch
    ? ''
    : serviceMatch
      ? 'service'
      : 'software';
}
