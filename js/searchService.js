/* js/searchService.js
 * Client-side search and filtering service. Works against a provided dataset array.
 * Each item in dataset expected to have keys: id, title, author, artist, translator, genre (array), type, country, status, rating, year, views, likes, updatedAt
 * Replace this service with server-side search when integrating (see INTEGRATION.md)
 */

const SearchService = (function(){
  let DATA = [];

  function setDataset(arr){ DATA = Array.isArray(arr) ? arr : []; }

  function scoreItem(item, query){
    if(!query) return item.views || 0;
    const q = query.toLowerCase();
    let score = 0;
    if(item.title && item.title.toLowerCase().includes(q)) score += 100;
    if(item.author && item.author.toLowerCase().includes(q)) score += 60;
    if(item.genre && item.genre.join(' ').toLowerCase().includes(q)) score += 30;
    // popularity boost
    score += Math.round((item.views || 0) / 1000) + Math.round((item.likes || 0) / 500);
    return score;
  }

  function matchFilters(item, filters){
    if(!filters) return true;
    if(filters.genre && filters.genre.length){
      // require at least one matching genre
      const has = item.genre && item.genre.some(g => filters.genre.includes(g));
      if(!has) return false;
    }
    if(filters.status && filters.status.length && !filters.status.includes(item.status)) return false;
    if(filters.country && filters.country.length && !filters.country.includes(item.country)) return false;
    if(filters.type && filters.type.length && !filters.type.includes(item.type)) return false;
    if(filters.author && filters.author.length && !filters.author.includes(item.author)) return false;
    if(filters.artist && filters.artist.length && !filters.artist.includes(item.artist)) return false;
    if(filters.translator && filters.translator.length && !filters.translator.includes(item.translator)) return false;
    if(filters.rating && filters.rating.length){
      const min = Math.min(...filters.rating); // expecting [min,max] or single
      if((item.rating||0) < min) return false;
    }
    if(filters.year && filters.year.length){
      if(!filters.year.includes(String(item.year))) return false;
    }
    return true;
  }

  function search({ query = '', filters = {}, sort = 'relevance', page = 1, perPage = 20 } = {}){
    let results = DATA.filter(item => matchFilters(item, filters));
    // score for relevance
    if(sort === 'relevance'){
      results = results.map(it => ({it, score: scoreItem(it, query)})).sort((a,b)=> b.score - a.score).map(x=>x.it);
    } else if(sort === 'newest'){
      results = results.sort((a,b)=> (new Date(b.updatedAt)||0) - (new Date(a.updatedAt)||0));
    } else if(sort === 'popular'){
      results = results.sort((a,b)=> (b.views||0) - (a.views||0));
    } else if(sort === 'alphabet'){
      results = results.sort((a,b)=> (a.title||'').localeCompare(b.title||''));
    }

    // simple query filter for non-relevance sorts
    if(query && sort !== 'relevance'){
      const q = query.toLowerCase();
      results = results.filter(it => (it.title&&it.title.toLowerCase().includes(q)) || (it.author&&it.author.toLowerCase().includes(q)) );
    }

    const total = results.length;
    const start = (page-1) * perPage;
    const pageItems = results.slice(start, start + perPage);
    return { total, results: pageItems, page, perPage };
  }

  // simple helper to build a dummy dataset when none provided
  function generateDummy(count = 200){
    const genres = ['Action','Romance','Fantasy','Slice of Life','Comedy','Isekai','Drama','Sci-Fi'];
    const types = ['Manga','Manhwa','Manhua','Novel'];
    const countries = ['JP','KR','CN','US','ID'];
    const arr = [];
    for(let i=1;i<=count;i++){
      arr.push({
        id: 's_'+i,
        title: `Sample Series ${i}`,
        author: `Author ${Math.ceil(i/5)}`,
        artist: `Artist ${Math.ceil(i/7)}`,
        translator: `Translator ${Math.ceil(i/8)}`,
        genre: [genres[i % genres.length]],
        type: types[i % types.length],
        country: countries[i % countries.length],
        status: (i%3===0)?'completed':'ongoing',
        rating: Math.round((Math.random()*4 + 1)*10)/10,
        year: 2015 + (i % 12),
        views: Math.floor(Math.random()*100000),
        likes: Math.floor(Math.random()*5000),
        updatedAt: new Date(Date.now()-i*86400000).toISOString(),
        cover: `/assets/images/covers/cover${(i%8)+1}.jpg`
      });
    }
    setDataset(arr);
    return arr;
  }

  return { setDataset, search, generateDummy };
})();

window.SearchService = SearchService;
