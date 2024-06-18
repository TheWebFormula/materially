// can use array of strings ['one', 'two']
// can also use array of objects with label property [{ label: 'one' }, { label: 'two' }] || [{ value: 'one' }, { value: 'two' }]
export default function fuzzySearch(searchTerm, items = [], distanceCap = 0.2) {
  items = items.filter(v => !!v);
  if (items.length === 0) return [];
  const type = typeof items[0];
  if (!['string', 'object'].includes(type)) throw Error('Incorrect items array');
  if (type === 'object') {
    if (typeof items[0].label !== 'string' && typeof items[0].value !== 'string') throw Error('Items array with objects must contain a label or value property that is a string');
  }

  distanceCap = 1 - distanceCap;
  searchTerm = searchTerm.toLowerCase().trim();
  const filterArr = items.map(item => {
    let label;
    if (type == 'object') label = item.label || item.value;
    else label = item;

    return {
      label,
      distance: jaroWinklerDistance(searchTerm, label.toLowerCase().trim()),
      item
    };
  });

  return filterArr
    .filter(({ distance }) => distance >= distanceCap)
    .sort((a, b) => b.distance - a.distance)
    .map(({ item }) => item);
}


function jaroWinklerDistance(searchTerm, target) {
  target = target.replace(/\s/g, '');
  let jaro = jaroDistance(searchTerm, target);

  if (jaro > 0.7) {
    let prefix = 0;
    const minLength = Math.min(searchTerm.length, target.length);

    for (let i = 0; i < minLength; i++) {
      if (searchTerm[i] == target[i]) prefix++;
      else break;
    }

    prefix = Math.min(4, prefix);
    jaro += 0.1 * prefix * (1 - jaro);
  }
  
  return jaro;
}

function jaroDistance(searchTerm, target) {
  if (searchTerm == target) return 1.0;

  const len1 = searchTerm.length;
  const len2 = target.length;
  const max = Math.floor(Math.max(len1, len2) / 2) - 1;
  const hashSearchTerm = Array(searchTerm.length).fill(0);
  const hashTarget = Array(searchTerm.length).fill(0);
  let matchCount = 0;
  let i = 0;
  for (; i < len1; i++) {
    for (let j = Math.max(0, i - max); j < Math.min(len2, i + max + 1); j++) {
      if (searchTerm[i] == target[j] && hashTarget[j] == 0) {
        hashSearchTerm[i] = 1;
        hashTarget[j] = 1;
        matchCount++;
        break;
      }
    }
  }

  if (matchCount == 0) return 0.0;

  let transpositionCount = 0;
  let point = 0;

  // Count number of occurrences
  // where two characters match but
  // there is a third matched character
  // in between the indices
  for (i = 0; i < len1; i++) {
    if (hashSearchTerm[i]) {
      // Find the next matched character
      // in second string
      while (hashTarget[point] == 0) {
        point++;
      }
      if (searchTerm[i] != target[point++]) transpositionCount++;
    }
  }

  transpositionCount /= 2;

  // Return the Jaro Similarity
  return ((matchCount) / (len1)
    + (matchCount) / (len2)
    + (matchCount - transpositionCount) / (matchCount))
    / 3.0;
}
